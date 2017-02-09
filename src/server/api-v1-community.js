'use strict';

const express = require('express');
const router = express.Router();
const config = require('server/config');
const knex = require('knex')(config.db);
const validator = require('is-my-json-valid/require');
// const logger = require('__/logging')(config.logger);

function validateInput(req, schema) {
  return new Promise((resolve, reject) => {
    const validate = validator(schema);
    if (validate(req.body)) {
      return resolve();
    }
    const error = JSON.stringify(validate.errors);
    reject({
      status: 400,
      title: 'Community data does not adhere to schema',
      meta: {resource: req.baseUrl, body: req.body, problems: error}
    });
  });
}

router.route('/')
  .get((req, res) => {
    knex('communities').select()
    .then(communities => {
      res.status(200).json(communities);
    });
  })
  .post((req, res, next) => {
    validateInput(req, 'schemas/community-in.json')
    .then(() => {
      knex('communities').insert(req.body, '*')
      .then(communities => {
        const community = communities[0];
        const location = req.baseUrl + '/' + community.id;
        res
        .status(201)
        .location(location)
        .json({
          links: {self: location},
          data: community
        });
      })
      .catch(error => {
        return next({
          status: 400,
          meta: error
        });
      });
    })
    .catch(error => {
      next(error);
    });
  })
  ;

module.exports = router;
