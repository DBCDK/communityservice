/*
 * Routes for endpoints concerning profiles.
 */

'use strict';

const express = require('express');
const config = require('server/config');
const knex = require('knex')(config.db);
const validators = require('server/validators');
const injectors = require('server/injectors');
const profileTable = 'profiles';

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
    const community = req.params.community;
    validators.validateInput(req, 'schemas/profile-post.json')
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
    next();
  })
  .put((req, res, next) => {
    const community = req.params.community;
    const id = req.params.id;
    validators.validateInput(req, 'schemas/profile-put.json')
    .then(() => {
      return knex(profileTable).where('id', id).select();
    })
    .then(matches => {
      if (!matches || matches.length !== 1) {
        throw {
          status: 404,
          title: `profile ${id} does not exist`,
          meta: {resource: req.path}
        };
      }
      const update = injectors.setModifiedEpoch(req.body);
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

module.exports = router;
