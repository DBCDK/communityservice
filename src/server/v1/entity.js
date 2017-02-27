/*
 * Routes for endpoints concerning entities.
 */

'use strict';

const express = require('express');
const config = require('server/config');
const knex = require('knex')(config.db);
const constants = require('server/constants')();
const entityTable = constants.entityTable;
const validatingInput = require('server/v1/verifiers').validatingInput;
const gettingCurrentTimeAsEpoch = require('server/v1/modifiers').gettingCurrentTimeAsEpoch;
const verifyingCommunityExists = require('server/v1/verifiers').verifyingCommunityExists;
const verifyingProfileExists = require('server/v1/verifiers').verifyingProfileExists;
const verifyingEntityExistsIfSet = require('server/v1/verifiers').verifyingEntityExistsIfSet;
const setCommunityId = require('server/v1/modifiers').setCommunityId;
const updateModificationLog = require('server/v1/modifiers').updateModificationLog;
const setDeletedBy = require('server/v1/modifiers').setDeletedBy;
const setModifiedBy = require('server/v1/modifiers').setModifiedBy;
const getMinimalDifference = require('server/v1/modifiers').getMinimalDifference;
const _ = require('lodash');

const router = express.Router({mergeParams: true});

router.route('/')
  .get((req, res, next) => {
    const community = req.params.community;
    verifyingCommunityExists(community, req.baseUrl)
    .then(() => {
      return knex(entityTable).where('community_id', community).select();
    })
    .then(entities => {
      res
      .status(200)
      .json({
        links: {self: req.baseUrl},
        data: entities
      });
    })
    .catch(error => {
      next(error);
    });
  })
  .post((req, res, next) => {
    const community = req.params.community;
    validatingInput(req, 'schemas/entity-post.json')
    .then(() => {
      return verifyingCommunityExists(community, req.baseUrl);
    })
    .then(() => {
      return setCommunityId(req.body, community);
    })
    .then(entity => {
      // Pass entity to next stage in chain when references have been checked.
      return Promise.all([
        entity,
        verifyingProfileExists(entity.owner_id, community, req.baseUrl, entity),
        verifyingEntityExistsIfSet(entity.entity_ref, community, req.baseUrl, entity)
      ]);
    })
    .then(results => {
      const entity = results[0];
      return knex(entityTable).insert(entity, '*');
    })
    .then(entities => {
      const entity = entities[0];
      const location = `${req.baseUrl}/${entity.id}`;
      res.status(201).location(location).json({
        links: {self: location},
        data: entity
      });
    })
    .catch(error => {
      next(error);
    });
  })
  ;

router.route('/:id')

  .get((req, res, next) => {
    const community = req.params.community;
    const id = req.params.id;
    verifyingCommunityExists(community, `${req.baseUrl}/${id}`)
    .then(() => {
      return knex(entityTable).where('id', id).select();
    })
    .then(entities => {
      if (!entities || entities.length !== 1) {
        throw {
          status: 404,
          title: 'Entity does not exist',
          meta: {resource: `${req.baseUrl}/${id}`}
        };
      }
      const entity = entities[0];
      const location = `${req.baseUrl}/${entity.id}`;
      res
      .status(200)
      .json({
        links: {self: location},
        data: entity
      });
    })
    .catch(error => {
      next(error);
    });
  })

  .put((req, res, next) => {
    const community = req.params.community;
    const id = req.params.id;
    validatingInput(req, 'schemas/entity-put.json')
    .then(() => {
      return verifyingCommunityExists(community, `${req.baseUrl}/${id}`);
    })
    .then(() => {
      return verifyingProfileExists(req.body.modified_by, community, req.baseUrl, req.body);
    })
    .then(() => {
      return knex(entityTable).where('id', id).select();
    })
    .then(entities => {
      if (!entities || entities.length !== 1) {
        throw {
          status: 404,
          title: 'Entity does not exist',
          meta: {resource: `${req.baseUrl}/${id}`}
        };
      }
      // Sequence several results together.
      return Promise.all([
        entities[0],
        gettingCurrentTimeAsEpoch()
      ]);
    })
    .then(results => {
      const entity = results[0];
      const epochNow = results[1];
      const update = updateOrDelete(req.body, entity, epochNow);
      return knex(entityTable).where('id', id).update(update, '*');
    })
    .then(entities => {
      const entity = entities[0];
      const location = `${req.baseUrl}/${entity.id}`;
      res.status(200).location(location).json({
        links: {self: location},
        data: entity
      });
    })
    .catch(error => {
      next(error);
    });
  })
  ;

router.route('/:id/attribute/:key')

  .get((req, res, next) => {
    const community = req.params.community;
    const id = req.params.id;
    const key = req.params.key;
    const location = `${req.baseUrl}${req.url}`;
    verifyingCommunityExists(community, location)
    .then(() => {
      return knex(entityTable).where('id', id).select();
    })
    .then(entities => {
      if (!entities || entities.length !== 1) {
        throw {
          status: 404,
          title: 'Entity does not exist',
          detail: `Entity ${id} unknown`,
          meta: {resource: location}
        };
      }
      return entities[0];
    })
    .then(entity => {
      const value = entity.attributes[key];
      if (typeof value === 'undefined') {
        throw {
          status: 404,
          title: 'Attribute does not exist',
          detail: `Attribute ${key} unknown`,
          meta: {resource: location}
        };
      }
      res
      .status(200)
      .json({
        links: {self: location},
        data: value
      });
    })
    .catch(error => {
      next(error);
    });
  })
  ;

function updateOrDelete(after, before, epochNow) {
  const afters = _.toPairs(after);
  if (afters.length === 1) {
    // Delete instead of update modify.
    return setDeletedBy(before, after.modified_by, epochNow);
  }
  let logEntry = setModifiedBy({}, after.modified_by, epochNow);
  const potentialKeys = ['title', 'type', 'contents', 'attributes'];
  const keys = _.intersection(_.keys(after), potentialKeys);
  const oldKeyValues = _.pick(before, keys);
  _.forEach(oldKeyValues, (value, key) => {
    const diffValue = getMinimalDifference(after[key], value);
    if (diffValue) {
      logEntry[key] = diffValue;
    }
  });
  let update = setModifiedBy(after, after.modified_by, epochNow);
  update = updateModificationLog(update, before, logEntry);
  return update;
}

module.exports = router;
