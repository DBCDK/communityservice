/*
 * Routes for endpoints concerning profiles.
 */

'use strict';

const express = require('express');
const config = require('server/config');
const knex = require('knex')(config.db);
const validateInput = require('server/validators').validateInput;
const injectors = require('server/injectors');
const profileTable = 'profiles';
const logger = require('__/logging')(config.logger);

// Make sure the {community} parameter is passed through the preceeding router.
const router = express.Router({mergeParams: true});

router.route('/')
  .get((req, res) => {
    knex(profileTable).select()
    .then(profiles => {
      res
      .status(200)
      .json({
        links: {self: req.baseUrl},
        data: profiles
      });
    });
  })
  .post((req, res, next) => {
    // logger.log.debug(req.params);
    const community = req.params.community;
    validateInput(req, 'schemas/profile-in.json')
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

module.exports = router;
