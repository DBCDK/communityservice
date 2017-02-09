'use strict';

const express = require('express');
const router = express.Router();
const config = require('server/config');
const knex = require('knex')(config.db);
const validator = require('is-my-json-valid/require');
// const logger = require('__/logging')(config.logger);

router.route('/')
  .get((req, res) => {
    knex('communities').select()
    .then(communities => {
      // logger.log.debug(communities);
      res.status(200).json(communities);
    });
  })
  .post((req, res, next) => { // eslint-disable-line no-unused-vars
    // logger.log.debug({path: req.baseUrl, body: req.body});
    const validate = validator('schemas/community-in.json');
    if (!validate(req.body)) {
      const error = JSON.stringify(validate.errors);
      return next({
        status: 400,
        title: 'Community data does not adhere to schema',
        meta: {resource: req.baseUrl, body: req.body, problems: error}
      });
    }
    knex('communities').insert(req.body, '*')
    .then(communities => {
      // logger.log.debug(communities);
      const community = communities[0];
      const location = req.baseUrl + '/' + community.id;
      // logger.log.debug(location);
      res
      .status(201)
      .location(location)
      .json({
        links: {self: location},
        data: community
      });
    })
    .catch(error => {
      // logger.log.error({path: req.baseUrl, error});
      return next({
        status: 400,
        meta: error
      });
    });
  });

module.exports = router;
