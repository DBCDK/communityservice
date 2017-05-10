/*
 * Routes for the complex-query endpoint.
 */

'use strict';

const _ = require('lodash');
const express = require('express');
const router = express.Router({mergeParams: true});
const build = require('./query-parser');
const gettingCurrentTimeAsEpoch = require('server/v1/modifiers').gettingCurrentTimeAsEpoch;
const config = require('server/config').server;
const constants = require('server/constants')();

router.route('/').post((req, res, next) => {
  handleQuery([], req, res, next);
});

router.route('/:option').post((req, res, next) => {
  const option = req.params.option;
  if (!constants.options.includes(option)) {
    return next({
      status: 400,
      title: 'Unknown option',
      detail: `Expected one of: ${constants.options.join(', ')}`,
      meta: {url: `${req.baseUrl}/${option}`}
    });
  }
  handleQuery([option], req, res, next);
});

function handleQuery(options, req, res, next) {
  gettingCurrentTimeAsEpoch()
  .then(epochNow => {
    if (config.fixedTime === '1') {
      // Override the current time because the tests need a fixed time.
      return 1490363949;
    }
    return epochNow;
  })
  .then(epochNow => {
    const community_id = req.params.community;
    const settings = {options, epochNow, community_id};
    const queryingOrError = build(req.body, settings);
    if (!_.isEmpty(queryingOrError.errors)) {
      const errors = queryingOrError.errors;
      throw {
        status: 400,
        title: 'Query is malformed',
        detail: errors,
        meta: {query: req.body}
      };
    }
    return queryingOrError.querying;
  })
  .then(querying => {
    // Initially the context is empty.
    return querying({});
  })
  .then(result => {
    res.status(200).json({
      data: result
    });
  })
  .catch(error => {
    switch (error.name) {
      case 'QueryDynamicError':
        return next({
          status: 400,
          title: 'Error during execution of query',
          detail: error.message,
          meta: {query: req.body, subquery: error.query, context: error.context}
        });
      case 'QueryServerError':
        return next({
          status: 500,
          title: 'Error during execution of query',
          detail: error.message,
          meta: {query: req.body, subquery: error.query, context: error.context}
        });
      default:
        return next(error);
    }
  });
}

module.exports = router;
