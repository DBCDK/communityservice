'use strict';

// Configuration
const config = require('server/config');
const constants = require('server/constants')();
const logger = require('__/logging')(config.logger);
const _ = require('lodash');

// Remote services.
const database = require('server/database');
const generatingServiceStatus = require('__/service/service-status');

// Web server.
const express = require('express');
const app = express();

// Securing headers.
const helmet = require('helmet');
app.use(helmet());

// All request bodies must be JSON.
const parser = require('body-parser');
app.use(parser.json({
  // Always assume JSON.
  type: '*/*',
  // Allow lone values.
  strict: false
}));

// Administrative API.

app.get('/howru', async (req, res) => {
  const configWithoutSecrets = _.omit(config, [
    'db.connection.user',
    'db.connection.password'
  ]);
  const status = await generatingServiceStatus([database]);
  Object.assign(status, {
    version: require('../package').version,
    'api-version': constants.apiversion,
    hostname: req.hostname,
    address: req.ip,
    config: configWithoutSecrets
  });
  res.json(status);
});

app.get('/pid', (req, res) => {
  res.type('text/plain');
  res.send(process.pid.toString());
});

app.get('/crash', (req, res, next) => { // eslint-disable-line no-unused-vars
  if (config.server.environment !== 'production') {
    throw new Error('Deliberate water landing');
  }
  next();
});

// Versioned API routes.
const routesV1 = require('server/v1/api');
app.use('/v1', routesV1);

// Error handlers.

app.use((req, res, next) => {
  next({
    status: 404,
    title: 'Unknown endpoint',
    meta: {resource: req.path}
  });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    next({
      status: err.status,
      title: 'Malformed body',
      detail: 'JSON syntax error',
      meta: {body: err.body}
    });
  }
  else {
    next(err);
  }
});

/*
 * General error handler.
 *
 * err properties supported (in accordance with http://jsonapi.org/format/#errors):
 * @param {status} HTTP status code to return.
 * @param {title} Stable identification of the error.
 * @param {detail} Detailed identification of the error.
 * @param {meta} Additional information.
 *
 * Additionally, in non-production mode, any stack trace and other properties
 * from err are included.
 */
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  err.status = err.status || 500;
  let returnedError = {
    status: err.status,
    code: err.code || err.status.toString(),
    title: err.title || (err.message || 'Unknown error')
  };
  if (err.detail) {
    returnedError.detail = err.detail;
  }
  if (err.meta) {
    returnedError.meta = err.meta;
  }
  res.status(returnedError.status);
  if (config.server.environment !== 'production') {
    // More information for non-produciton.
    Object.assign(returnedError, err);
    if (err.stack) {
      returnedError.stack = err.stack;
    }
  }
  if (returnedError.status >= 500 && config.server.logServiceErrors === 1) {
    logger.log.error(returnedError);
  }
  res.json({errors: [returnedError]});
});

module.exports = app;
