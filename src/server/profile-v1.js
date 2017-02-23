/*
 * Routes for endpoints concerning profiles.
 */

'use strict';

const express = require('express');
const config = require('server/config');
const knex = require('knex')(config.db);
const validators = require('server/validators');
const injectors = require('server/injectors');
const _ = require('lodash');
const profileTable = 'profiles';

const logger = require('__/logging')(config.logger);

// Make sure the {community} parameter is passed through the preceeding router.
const router = express.Router({mergeParams: true});

router.route('/')
  .get((req, res, next) => {
    const community = req.params.community;
    validators.verifyCommunityExists(community, req.baseUrl)
    .then(() => {
      return knex(profileTable).where('community_id', community).select();
    })
    .then(profiles => {
      res
      .status(200)
      .json({
        links: {self: req.baseUrl},
        data: profiles
      });
    })
    .catch(error => {
      next(error);
    });
  })
  .post((req, res, next) => {
    const community = req.params.community;
    validators.validateInput(req, 'schemas/profile-post.json')
    .then(() => {
      return validators.verifyCommunityExists(community, req.baseUrl);
    })
    .then(() => {
      return injectors.setCommunityId(req.body, community);
    })
    .then(profile => {
      return knex(profileTable).insert(profile, '*');
    })
    .then(profiles => {
      const profile = profiles[0];
      const location = `${req.baseUrl}/${profile.id}`;
      res.status(201).location(location).json({
        links: {self: location},
        data: profile
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
    validators.verifyCommunityExists(community, `${req.baseUrl}/${id}`)
    .then(() => {
      return knex(profileTable).where('id', id).select();
    })
    .then(profiles => {
      if (!profiles || profiles.length !== 1) {
        throw {
          status: 404,
          title: 'Profile does not exist',
          detail: `Profile ${id} unknown`,
          meta: {resource: `${req.baseUrl}/${id}`}
        };
      }
      const profile = profiles[0];
      const location = `${req.baseUrl}/${profile.id}`;
      res
      .status(200)
      .json({
        links: {self: location},
        data: profile
      });
    })
    .catch(error => {
      next(error);
    });
  })
  .put((req, res, next) => {
    const community = req.params.community;
    const id = req.params.id;
    validators.validateInput(req, 'schemas/profile-put.json')
    .then(() => {
      return validators.verifyCommunityExists(community, `${req.baseUrl}/${id}`);
    })
    .then(() => {
      return knex(profileTable).where('id', id).select();
    })
    .then(matches => {
      if (!matches || matches.length !== 1) {
        throw {
          status: 404,
          title: 'Profile does not exist',
          detail: `Profile ${id} unknown`,
          meta: {resource: `${req.baseUrl}/${id}`}
        };
      }
      const profile = matches[0];
      const update = updateOrDelete(req.body, profile);
      const query = knex(profileTable).where('id', id).update(update, '*').toString();
      // logger.log.debug(query);
      return knex(profileTable).where('id', id).update(update, '*');
    })
    .then(profiles => {
      const profile = profiles[0];
      const location = `${req.baseUrl}/${profile.id}`;
      res.status(200).location(location).json({
        links: {self: location},
        data: profile
      });
    })
    .catch(error => {
      next(error);
    });
  })
  ;

function updateOrDelete(after, before) {
  const afters = _.toPairs(after);
  if (afters.length === 1) {
    // Delete intead of update modify.
    return injectors.setDeletedBy(before, after.modified_by);
  }
  let last_epoch = before.modified_epoch;
  if (!last_epoch) {
    last_epoch = before.created_epoch;
  }
  let logEntry = {
    modified_by: after.modified_by,
    last_epoch
  };
  const keys = ['name', 'attributes'];
  const oldKeyValues = _.pick(before, keys);
  _.forEach(oldKeyValues, (value, key) => {
    if (after[key] !== value) {
      logEntry[key] = value;
    }
  });
  const update = injectors.updateModificationLog(after, before, logEntry);
  // logger.log.debug(update);
  return update;
}

module.exports = router;

// TODO: check modified_by is a existing profile in the right community.
