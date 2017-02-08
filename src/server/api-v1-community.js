'use strict';

const express = require('express');
const router = express.Router();
const queries = require('server/queries');

router.route('/')
  .get((req, res, next) => {
    queries.getAll()
    .then(communities => {
      try {
        // logger.log.debug(communities);
        res.status(200).json(communities);
      }
      catch (error) {
        // Pass error to default error handler.
        next(error);
      }
    });
  })
  .post((req, res) => {
    res.sendStatus(400);
  });

module.exports = router;
