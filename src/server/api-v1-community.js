/*
 * Routes for endpoints concerning communities.
 */

'use strict';

const express = require('express');
const router = express.Router();
const config = require('server/config');
const knex = require('knex')(config.db);
const validator = require('is-my-json-valid/require');
const communityTable = 'communities';
const logger = require('__/logging')(config.logger);

router.route('/')
  .get((req, res) => {
    knex(communityTable).select()
    .then(communities => {
      res
      .status(200)
      .json({
        links: {self: req.baseUrl},
        data: communities
      });
    });
  })
  .post((req, res, next) => {
    validateInput(req, 'schemas/community-in.json')
    .then(() => {
      knex(communityTable)
      .insert(req.body, '*')
      .then(communities => {
        const community = communities[0];
        const location = req.baseUrl + '/' + community.id;
        res
        .status(201)
        .location(location)
        .json({
          links: {self: location},
          data: community
        });
      })
      .catch(error => {
        return next({
          status: 400,
          meta: error
        });
      });
    })
    .catch(error => {
      next(error);
    });
  })
  ;

router.route('/:id')
  .put((req, res, next) => {
    validateInput(req, 'schemas/community-in.json')
    .then(() => {
      const id = req.params.id;
      const update = setModifiedEpoch(req.body);
      knex(communityTable)
      .where('id', id)
      .update(update, '*')
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
        const location = req.baseUrl + '/' + community.id;
        res
        .status(200)
        .json({
          links: {self: location},
          data: community
        });
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
      // logger.log.debug(`id = ${id}`);
      knex(communityTable)
      .where('id', id)
      .select()
      .then(communities => {
        // logger.log.debug(`communities = ${communities}`);
        if (communities.length === 0) {
          return next({
            status: 404,
            title: 'Community does not exist',
            detail: `Community ${id} unknown`,
            meta: {resource: req.path}
          });
        }
        const community = communities[0];
        // const c = JSON.stringify(community);
        // logger.log.debug(`community = ${c}`);
        const location = req.baseUrl + '/' + community.id;
        res
        .status(200)
        .json({
          links: {self: location},
          data: community
        });
      })
      .catch(error => {
        return next(error);
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

function validateInput(req, schema) {
  return new Promise((resolve, reject) => {
    const validate = validator(schema);
    if (validate(req.body)) {
      return resolve();
    }
    const error = JSON.stringify(validate.errors);
    reject({
      status: 400,
      title: 'Community data does not adhere to schema',
      meta: {resource: req.baseUrl, body: req.body, problems: error}
    });
  });
}

function setModifiedEpoch(community) {
  return Object.assign(community, {
    modified_epoch: knex.raw('extract(\'epoch\' from now())')
  });
}

function locateCommunityId(name) {
  return new Promise((resolve, reject) => {
    const number = parseInt(name, 10);
    if (!isNaN(number)) {
      return resolve(number);
    }
    return knex(communityTable).where({name}).select('id')
    .then(ids => {
      // logger.log.debug(ids);
      if (ids.length !== 1) {
        return reject();
      }
      return resolve(ids[0].id);
    })
    .catch(error => {
      logger.log.error({
        detail: `community ${name} requested`,
        error
      });
      return reject();
    });
  });
}

module.exports = router;
