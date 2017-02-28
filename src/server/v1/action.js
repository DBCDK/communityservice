/*
 * Routes for endpoints concerning actions.
 */

'use strict';

const express = require('express');
const config = require('server/config');
const knex = require('knex')(config.db);
const verifyingCommunityExists = require('server/v1/verifiers').verifyingCommunityExists;
const validatingInput = require('server/v1/verifiers').validatingInput;
const setCommunityId = require('server/v1/modifiers').setCommunityId;
const constants = require('server/constants')();
const actionTable = constants.actionTable;

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

module.exports = router;
