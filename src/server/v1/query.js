/*
 * Routes for the complex-query endpoint.
 */

'use strict';

const express = require('express');
const router = express.Router();
const build = require('./query-parser');

router.route('/').post((req, res, next) => {
  build(req.body)
  .then(performingQuery => {
    return performingQuery({});
  })
  .then(result => {
    res.status(200).json({
      data: result
    });
  })
  .catch(error => {
    switch (error.name) {
      case 'QueryParserError':
        return next({
          status: 400,
          title: error.message,
          detail: error.errors,
          meta: {query: req.body}
        });
      case 'QueryDynamicError':
        return next({
          status: 500,
          title: 'Error during execution of query',
          detail: error.message,
          meta: {query: error.query, context: error.context}
        });
      default:
        return next(error);
    }
  });
});

module.exports = router;
