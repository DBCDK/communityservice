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
    validators.verifyingCommunityExists(community, req.baseUrl)
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
    validators.validatingInput(req, 'schemas/profile-post.json')
    .then(() => {
      return validators.verifyingCommunityExists(community, req.baseUrl);
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
    validators.verifyingCommunityExists(community, `${req.baseUrl}/${id}`)
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
    validators.validatingInput(req, 'schemas/profile-put.json')
    .then(() => {
      return validators.verifyingCommunityExists(community, `${req.baseUrl}/${id}`);
    })
    .then(() => {
      return validators.verifyingProfileExists(req.body.modified_by, req.baseUrl);
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
      // Sequence several results together.
      return Promise.all([
        matches[0],
        injectors.gettingCurrentTimeAsEpoch()
      ]);
    })
    .then(results => {
      const profile = results[0];
      const epochNow = results[1];
      const update = updateOrDelete(req.body, profile, epochNow);
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

function getMinimalDifference(after, before) {
  if (typeof after === typeof before) {
    if (typeof after === 'object') {
      const diff = _.omitBy(before, (v, k) => {
        return after[k] === v;
      });
      if (_.isEmpty(diff)) {
        return null;
      }
      return diff;
    }
    else if (after === before) {
      return null;
    }
  }
  return before;
}

function updateOrDelete(after, before, epochNow) {
  const afters = _.toPairs(after);
  if (afters.length === 1) {
    // Delete intead of update modify.
    return injectors.setDeletedBy(before, after.modified_by, epochNow);
  }
  let logEntry = injectors.setModifiedBy({}, after.modified_by, epochNow);
  const potentialKeys = ['name', 'attributes'];
  const keys = _.intersection(_.keys(after), potentialKeys);
  const oldKeyValues = _.pick(before, keys);
  _.forEach(oldKeyValues, (value, key) => {
    const diffValue = getMinimalDifference(after[key], value);
    if (diffValue) {
      logEntry[key] = diffValue;
    }
  });
  let update = injectors.setModifiedBy(after, after.modified_by, epochNow);
  update = injectors.updateModificationLog(update, before, logEntry);
  return update;
}

module.exports = router;
