/*
 * Routes for endpoints concerning communities.
 */

'use strict';

const express = require('express');
const router = express.Router();
const config = require('server/config');
const logger = require('__/logging')(config.logger);
const knex = require('knex')(config.db);
const {validatingInput} = require('server/v2/verifiers');
const {updateCommunity} = require('server/v2/modifiers');
const constants = require('server/constants')();
const communityTable = constants.community.table;

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
    const location = `${req.baseUrl}/${id}`;
    validatingInput(req, 'schemas/community-put.json')
    .then(() => {
      // Sequence several results together.
      return Promise.all([
        gettingCommunity(id, location)
        // gettingCurrentTimeAsEpoch()
      ]);
    })
    .then(results => {
      const community = results[0];
      // const epoch = results[1];
      var update = updateCommunity(req.body, community);
      return knex(communityTable).where('id', id).update(update, '*');
    })
    .then(communities => {
      const community = communities[0];
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
    let location = `${req.baseUrl}/${name}`;
    locateCommunityName(name)
    .then(id => {
      const selector = knex(communityTable).where('id', id).select();
      // Sequence several results together.
      return Promise.all([id, selector]);
    })
    .then(results => {
      const id = results[0];
      location = `${req.baseUrl}/${id}`;
      const communities = results[1];
      if (communities.length === 0) {
        return next({
          status: 404,
          title: 'Community does not exist',
          detail: `Community ${id} unknown`,
          meta: {resource: location}
        });
      }
      const community = communities[0];
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
        meta: {resource: location}
      });
    });
  })
;

module.exports = router;

function gettingCommunity(id, url) {
  return new Promise((resolve, reject) => {
    knex(communityTable).where('id', id).select()
    .then(communities => {
      if (!communities || communities.length !== 1) {
        let meta = {};
        meta.resource = url;
        let details = {
          problem: `Community ${id} does not exist`
        };
        return reject({
          status: 404,
          title: 'Community does not exist',
          details,
          meta
        });
      }
      resolve(communities[0]);
    })
    .catch(error => {
      reject(error);
    });
  });
}

function locateCommunityName(name) {
  return new Promise((resolve, reject) => {
    const number = parseInt(name, 10);
    if (!isNaN(number)) {
      return resolve(number);
    }
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
