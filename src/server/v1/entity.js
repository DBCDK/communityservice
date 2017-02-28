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
const updateOrDelete = require('server/v1/modifiers').updateOrDelete;
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
      res.status(200).json({
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
    const location = `${req.baseUrl}/${id}`;
    gettingEntityFromCommunity(id, community, location)
    .then(entity => {
      res.status(200).json({
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
    const location = `${req.baseUrl}/${id}`;
    validatingInput(req, 'schemas/entity-put.json')
    .then(() => {
      return gettingEntityFromCommunity(id, community, location, req.body);
    })
    .then(entity => {
      // Sequence several results together.
      return Promise.all([
        entity,
        gettingCurrentTimeAsEpoch(),
        verifyingProfileExists(req.body.modified_by, community, req.baseUrl, req.body)
      ]);
    })
    .then(results => {
      const entity = results[0];
      const epochNow = results[1];
      const update = updateOrDelete(req.body, entity, epochNow, ['title', 'type', 'contents', 'attributes']);
      return knex(entityTable).where('id', id).update(update, '*');
    })
    .then(entities => {
      const entity = entities[0];
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

router.route('/:id/attribute')

  .post((req, res, next) => {
    const community = req.params.community;
    const id = req.params.id;
    const location = `${req.baseUrl}${req.url}`;
    gettingEntityFromCommunity(id, community, location)
    .then(entity => {
      const attributes = entity.attributes;
      _.forEach(req.body, (value, key) => {
        if (_.has(attributes, key)) {
          throw {
            status: 409,
            title: 'Attribute already exists',
            detail: `Attribute ${key} has value ${attributes.key}`,
            meta: {resource: location}
          };
        }
        attributes[key] = value;
      });
      res.status(201).location(location).json({
        links: {self: location},
        data: attributes
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
    gettingEntityFromCommunity(id, community, location)
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
      res.status(200).json({
        links: {self: location},
        data: value
      });
    })
    .catch(error => {
      next(error);
    });
  });

module.exports = router;

function gettingEntityFromCommunity(id, community, url, object) {
  return new Promise((resolve, reject) => {
    knex(entityTable).where('id', id).select()
    .then(entities => {
      if (!entities || entities.length !== 1) {
        let meta = {};
        if (url) {
          meta.resource = url;
        }
        let details = {
          problem: `Entity ${id} does not exist`
        };
        if (object) {
          details.data = object;
        }
        return reject({
          status: 404,
          title: 'Entity does not exist',
          details,
          meta
        });
      }
      return entities[0];
    })
    .then(entity => {
      if (entity.community_id !== Number(community)) {
        return verifyingCommunityExists(community, url)
        .then(() => {
          let meta = {};
          if (url) {
            meta.resource = url;
          }
          let details = {
            problem: `Entity ${id} does not belong to community ${community}`
          };
          if (object) {
            details.data = object;
          }
          return reject({
            status: 400,
            title: 'Entity does not belong to community',
            details,
            meta
          });
        })
        .catch(error => {
          reject(error);
        });
      }
      resolve(entity);
    })
    .catch(error => {
      reject(error);
    });
  });
}
