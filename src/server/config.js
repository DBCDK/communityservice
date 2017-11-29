'use strict';

const tcp = require('__/tcp');
const hostname = require('os').hostname;
const knexfile = require('./knexfile');

// This (and the included knexfile) is the only place to read process.env
// settings.  The point is that the servive should use the configuration like
//
//     const config = require('server/config')
//
// and just extract needed configuration parts and pass them on to modules that
// need them, like
//
//     mymodule(config.logger)
//
// or alternatively
//
//     const port = require('server/config').server.port
//     mymodule(port)

function Defaults () {
  const environment = process.env.NODE_ENV || 'development';
  const niceHostName = hostname().replace('.domain_not_set.invalid', '');
  const fixedTime = process.env.FIX_TIME_FOR_TESTING || 0;
  return {
    environment,
    hostname: niceHostName,
    fixedTime
  };
}

const defaults = new Defaults();

/*
 * Configuration groups for various modules.
 */

exports.server = {
  environment: defaults.environment,
  logServiceErrors: parseInt(process.env.LOG_SERVICE_ERRORS || 1, 10),
  port: tcp.normalizePort(process.env.PORT) || 3000,
  hostname: 'elvis.dbc.dk',
  fixedTime: defaults.fixedTime,
  testTimeoutMs: 20*1000
};

exports.logger = {
  environment: defaults.environment,
  level: process.env.LOG_LEVEL || 'INFO',
  pretty: parseInt(process.env.PRETTY_LOG || 1, 10),
  hostname: defaults.hostname
};

exports.db = knexfile[defaults.environment];
