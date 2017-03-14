/*
 * Routes for the complex-query endpoint.
 */

'use strict';

const _ = require('lodash');
const express = require('express');
const router = express.Router();
const build = require('./query-parser');

router.route('/').post((req, res, next) => {
  const queryingOrError = build(req.body);
  if (!_.isEmpty(queryingOrError.errors)) {
    const errors = queryingOrError.errors;
    return next({
      status: 400,
      title: 'Query is malformed',
      detail: errors,
      meta: {query: req.body}
    });
  }
  // Initially the context is empty.
  queryingOrError.querying({})
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
        console.log(`Unexpected error: ${error}`);
        return next(error);
    }
  });
});

module.exports = router;
