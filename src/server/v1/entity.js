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
const verifyingCommunityExists = require('server/v1/verifiers').verifyingCommunityExists;
const verifyingProfileExists = require('server/v1/verifiers').verifyingProfileExists;
const setCommunityId = require('server/v1/modifiers').setCommunityId;

const router = express.Router({mergeParams: true});

router.route('/')
  .get((req, res, next) => {
    const community = req.params.community;
    verifyingCommunityExists(community, req.baseUrl)
    .then(() => {
      return knex(entityTable).where('community_id', community).select();
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
    validatingInput(req, 'schemas/entity-post.json')
    .then(() => {
      return verifyingCommunityExists(community, req.baseUrl);
    })
    .then(() => {
      return setCommunityId(req.body, community);
    })
    .then(entity => {
      // Pass entity to next stage in chain.
      return Promise.all([
        entity,
        verifyingProfileExists(entity.owner_id, community, req.baseUrl, entity)
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

module.exports = router;
