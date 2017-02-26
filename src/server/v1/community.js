/*
 * Routes for endpoints concerning communities.
 */

'use strict';

const express = require('express');
const router = express.Router();
const config = require('server/config');
const logger = require('__/logging')(config.logger);
const knex = require('knex')(config.db);
const validatingInput = require('server/v1/verifiers').validatingInput;
const gettingCurrentTimeAsEpoch = require('server/v1/modifiers').gettingCurrentTimeAsEpoch;
const setModifiedEpoch = require('server/v1/modifiers').setModifiedEpoch;
const constants = require('server/constants')();
const communityTable = constants.communityTable;

router.route('/')

  .get((req, res) => {
    knex(communityTable).select()
    .then(communities => {
      res.status(200).json({
        links: {self: req.baseUrl},
        data: communities
      });
    });
  })

  .post((req, res, next) => {
    validatingInput(req, 'schemas/community-post.json')
    .then(() => {
      return knex(communityTable).insert(req.body, '*');
    })
    .then(communities => {
      const community = communities[0];
      const location = `${req.baseUrl}/${community.id}`;
      res.status(201).location(location).json({
        links: {self: location},
        data: community
      });
    })
    .catch(error => {
      next(error);
    });
  });

router.route('/:id')

  .put((req, res, next) => {
    const id = req.params.id;
    validatingInput(req, 'schemas/community-put.json')
    .then(() => {
      return gettingCurrentTimeAsEpoch();
    })
    .then(epoch => {
      const update = setModifiedEpoch(req.body, epoch);
      return knex(communityTable).where('id', id).update(update, '*');
    })
    .then(communities => {
      if (communities.length === 0) {
        return next({
          status: 404,
          title: 'Community does not exist',
          detail: `Community ${id} unknown`,
          meta: {resource: req.path}
        });
      }
      const community = communities[0];
      const location = `${req.baseUrl}/${community.id}`;
      res.status(200).json({
        links: {self: location},
        data: community
      });
    })
    .catch(error => {
      next(error);
    });
  })

  .get((req, res, next) => {
    const name = req.params.id;
    locateCommunityId(name)
    .then(id => {
      const selector = knex(communityTable).where('id', id).select();
      // Sequence several results together.
      return Promise.all([id, selector]);
    })
    .then(results => {
      const id = results[0];
      const communities = results[1];
      if (communities.length === 0) {
        return next({
          status: 404,
          title: 'Community does not exist',
          detail: `Community ${id} unknown`,
          meta: {resource: req.path}
        });
      }
      const community = communities[0];
      const location = `${req.baseUrl}/${community.id}`;
      res
      .status(200)
      .json({
        links: {self: location},
        data: community
      });
    })
    .catch(() => {
      return next({
        status: 404,
        title: 'Community does not exist',
        detail: `Community ${name} unknown`,
        meta: {resource: req.path}
      });
    });
  })
  ;

function locateCommunityId(name) {
  return new Promise((resolve, reject) => {
    const number = parseInt(name, 10);
    if (!isNaN(number)) {
      return resolve(number);
    }
    // TODO: eliminate returns.
    return knex(communityTable).where({name}).select('id')
    .then(ids => {
      if (ids.length !== 1) {
        return reject();
      }
      return resolve(ids[0].id);
    })
    .catch(error => {
      logger.log.warning({
        detail: `community ${name} requested`,
        error
      });
      return reject();
    });
  });
}

module.exports = router;
