/*
 * Routes for endpoints concerning profiles.
 */

'use strict';

const express = require('express');
const config = require('server/config');
const knex = require('knex')(config.db);
const verifyingCommunityExists = require('server/v1/verifiers').verifyingCommunityExists;
const verifyingProfileExists = require('server/v1/verifiers').verifyingProfileExists;
const validatingInput = require('server/v1/verifiers').validatingInput;
const gettingCurrentTimeAsEpoch = require('server/v1/modifiers').gettingCurrentTimeAsEpoch;
const setCommunityId = require('server/v1/modifiers').setCommunityId;
const updateOrDelete = require('server/v1/modifiers').updateOrDelete;
const constants = require('server/constants')();
const profileTable = constants.profileTable;

// const logger = require('__/logging')(config.logger);

// Make sure the {community} parameter is passed through the preceeding router.
const router = express.Router({mergeParams: true});

router.route('/')

  .get((req, res, next) => {
    const community = req.params.community;
    verifyingCommunityExists(community, req.baseUrl)
    .then(() => {
      return knex(profileTable).where('community_id', community).select();
    })
    .then(profiles => {
      res.status(200).json({
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
    validatingInput(req, 'schemas/profile-post.json')
    .then(() => {
      return verifyingCommunityExists(community, req.baseUrl);
    })
    .then(() => {
      return setCommunityId(req.body, community);
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
    const location = `${req.baseUrl}/${id}`;
    gettingProfileFromCommunity(id, community, location)
    .then(profile => {
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
    const location = `${req.baseUrl}/${id}`;
    validatingInput(req, 'schemas/profile-put.json')
    .then(() => {
      return gettingProfileFromCommunity(id, community, location, req.body);
    })
    .then(profile => {
      // Sequence several results together.
      return Promise.all([
        profile,
        gettingCurrentTimeAsEpoch(),
        verifyingProfileExists(req.body.modified_by, community, req.baseUrl, req.body)
      ]);
    })
    .then(results => {
      const profile = results[0];
      const epochNow = results[1];
      const update = updateOrDelete(req.body, profile, epochNow, ['name', 'attributes']);
      return knex(profileTable).where('id', id).update(update, '*');
    })
    .then(profiles => {
      const profile = profiles[0];
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

module.exports = router;

function gettingProfileFromCommunity(id, community, url, object) {
  return new Promise((resolve, reject) => {
    knex(profileTable).where('id', id).select()
    .then(profiles => {
      if (!profiles || profiles.length !== 1) {
        let meta = {};
        if (url) {
          meta.resource = url;
        }
        let details = {
          problem: `Profile ${id} does not exist`
        };
        if (object) {
          details.data = object;
        }
        return reject({
          status: 404,
          title: 'Profile does not exist',
          details,
          meta
        });
      }
      return profiles[0];
    })
    .then(profile => {
      if (profile.community_id !== Number(community)) {
        return verifyingCommunityExists(community, url)
        .then(() => {
          let meta = {};
          if (url) {
            meta.resource = url;
          }
          let details = {
            problem: `Profile ${id} does not belong to community ${community}`
          };
          if (object) {
            details.data = object;
          }
          return reject({
            status: 400,
            title: 'Profile does not belong to community',
            details,
            meta
          });
        })
        .catch(error => {
          reject(error);
        });
      }
      resolve(profile);
    })
    .catch(error => {
      reject(error);
    });
  });
}
