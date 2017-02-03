'use strict';

// const config = require('server/config');
const express = require('express');
const helmet = require('helmet');

const app = express();
app.use(helmet());

app.get('/v1/status', (req, res) => {
  res.json({
    siteversion: require('../package').version,
    apiversion: '1',
    hostname: req.hostname,
    address: req.ip,
    protocol: req.protocol
  });
});

app.get('/v1/pid', (req, res) => {
  res.type('text/plain');
  res.send(process.pid.toString());
});

app.use((req, res) => {
  const message = {error: 'unknown endpoint', resource: req.path};
  res.status(404);
  if (req.accepts('json')) {
    res.send(message);
    return;
  }
  res.type('txt').send(`${message.error}: ${message.resource}`);
});

module.exports = app;
