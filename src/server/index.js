'use strict';

const config = require('server/config');
const express = require('express');
const helmet = require('helmet');
const logger = require('__/logging')(config.logger);
const routesV1 = require('server/api-v1');

const app = express();
app.use(helmet());

app.get('/status', (req, res) => {
  res.json({
    siteversion: require('../package').version,
    apiversion: '1',
    hostname: req.hostname,
    address: req.ip,
    protocol: req.protocol
  });
});

app.get('/pid', (req, res) => {
  res.type('text/plain');
  res.send(process.pid.toString());
});

app.use('/v1', routesV1);

app.use((req, res) => {
  const message = {error: 'unknown endpoint', resource: req.path};
  res.status(404);
  if (req.accepts('json')) {
    res.send(message);
    return;
  }
  res.type('txt').send(`${message.error}: ${message.resource}`);
});

app.use((err, req, res, next) => {
  logger.log.error('Internal error', err);
  res.status(err.status || 500);
  let error = {};
  if (config.server.environment === 'development') {
    // Return stack trace on errors in development mode.
    error = err;
  }
  res.json({
    message: err.message,
    error
  });
  next();
});

module.exports = app;
