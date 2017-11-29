/*
 * Routes for endpoints concerning actions.
 */

'use strict';

const express = require('express');
const config = require('server/config');
const knex = require('knex')(config.db);
const verifyingCommunityExists = require('server/v1/verifiers').verifyingCommunityExists;
const verifyingProfileExists = require('server/v1/verifiers').verifyingProfileExists;
const verifyingProfileExistsIfSet = require('server/v1/verifiers').verifyingProfileExistsIfSet;
const verifyingEntityExistsIfSet = require('server/v1/verifiers').verifyingEntityExistsIfSet;
const validatingInput = require('server/v1/verifiers').validatingInput;
const gettingCurrentTimeAsEpoch = require('server/v1/modifiers').gettingCurrentTimeAsEpoch;
const setCommunityId = require('server/v1/modifiers').setCommunityId;
const constants = require('server/constants')();
const actionTable = constants.action.table;
const updateOrDelete = require('server/v1/modifiers').updateOrDelete;

// Make sure the {community} parameter is passed through the preceeding router.
const router = express.Router({mergeParams: true});

router.route('/')

  .get((req, res, next) => {
    const community = req.params.community;
    verifyingCommunityExists(community, req.baseUrl)
    .then(() => {
      return knex(actionTable).where('community_id', community).select();
    })
    .then(actions => {
      res.status(200).json({
        links: {self: req.baseUrl},
        data: actions
      });
    })
    .catch(error => {
      next(error);
    });
  })

  .post((req, res, next) => {
    const community = req.params.community;
    validatingInput(req, 'schemas/action-post.json')
    .then(() => {
      return verifyingCommunityExists(community, req.baseUrl);
    })
    .then(() => {
      return verifyingProfileExistsIfSet(req.body.profile_ref, community, req.baseUrl, req.body);
    })
    .then(() => {
      return verifyingEntityExistsIfSet(req.body.entity_ref, community, req.baseUrl, req.body);
    })
    .then(() => {
      return setCommunityId(req.body, community);
    })
    .then(action => {
      return knex(actionTable).insert(action, '*');
    })
    .then(actions => {
      const action = actions[0];
      const location = `${req.baseUrl}/${action.id}`;
      res.status(201).location(location).json({
        links: {self: location},
        data: action
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
    gettingActionFromCommunity(id, community, location)
    .then(action => {
      res
      .status(200)
      .json({
        links: {self: location},
        data: action
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
    validatingInput(req, 'schemas/action-put.json')
    .then(() => {
      return gettingActionFromCommunity(id, community, location, req.body);
    })
    .then(action => {
      // Group several results and checks together.
      return Promise.all([
        action,
        gettingCurrentTimeAsEpoch(),
        verifyingProfileExists(req.body.modified_by, community, req.baseUrl, req.body),
        verifyingProfileExistsIfSet(req.body.profile_ref, community, req.baseUrl, req.body),
        verifyingEntityExistsIfSet(req.body.entity_ref, community, req.baseUrl, req.body)
      ]);
    })
    .then(results => {
      const action = results[0];
      const epochNow = results[1];
      const update = updateOrDelete(req.body, action, epochNow, [
        'type', 'profile_ref', 'entity_ref', 'attributes'
      ]);
      return knex(actionTable).where('id', id).update(update, '*');
    })
    .then(entities => {
      const action = entities[0];
      res.status(200).location(location).json({
        links: {self: location},
        data: action
      });
    })
    .catch(error => {
      next(error);
    });
  })
;

module.exports = router;

function gettingActionFromCommunity(id, community, url, object) {
  return new Promise((resolve, reject) => {
    knex(actionTable).where('id', id).select()
    .then(actions => {
      if (!actions || actions.length !== 1) {
        let meta = {};
        if (url) {
          meta.resource = url;
        }
        let details = {
          problem: `Action ${id} does not exist`
        };
        if (object) {
          details.data = object;
        }
        return reject({
          status: 404,
          title: 'Action does not exist',
          details,
          meta
        });
      }
      return actions[0];
    })
    .then(action => {
      if (action.community_id !== Number(community)) {
        return verifyingCommunityExists(community, url)
        .then(() => {
          let meta = {};
          if (url) {
            meta.resource = url;
          }
          let details = {
            problem: `Action ${id} does not belong to community ${community}`
          };
          return reject({
            status: 400,
            title: 'Action does not belong to community',
            details,
            meta
          });
        })
        .catch(error => {
          reject(error);
        });
      }
      resolve(action);
    })
    .catch(error => {
      reject(error);
    });
  });
}
