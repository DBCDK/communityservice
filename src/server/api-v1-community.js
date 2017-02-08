'use strict';

const express = require('express');
const router = express.Router();
const config = require('server/config');
const knex = require('knex')(config.db);
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
    knex('communities').insert(req.body, '*')
    .then(community => {
      res.status(201).json(community);
    })
    .catch(error => {
      // logger.log.error({path: req.baseUrl, error});
      res.status(400).json(error);
    });
  });

module.exports = router;
