/*
 * Routes for the complex-query endpoint.
 */

'use strict';

const express = require('express');
const router = express.Router();
// const config = require('server/config');
// const logger = require('__/logging')(config.logger);
// const knex = require('knex')(config.db);
// const validatingInput = require('server/v1/verifiers').validatingInput;
// const constants = require('server/constants')();
// const communityTable = constants.communityTable;

router.route('/')

  .get((req, res, next) => {
    next();
  })
  ;

module.exports = router;
