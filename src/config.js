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

function Defaults() {
  const environment = process.env.NODE_ENV || 'development';
  const port = tcp.normalizePort(process.env.PORT) || 3000;
  const prettyLog = process.env.PRETTY_LOG || 1;
  const logLevel = process.env.LOG_LEVEL || 'INFO';
  const logServiceErrors = process.env.LOG_SERVICE_ERRORS || 1;
  const niceHostName = hostname().replace('.domain_not_set.invalid', '');
  const fixedTime = process.env.FIX_TIME_FOR_TESTING || 0;
  return {
    environment,
    hostname: niceHostName,
    port,
    logServiceErrors,
    fixedTime,
    prettyLog,
    logLevel
  };
}

const defaults = new Defaults();

/*
 * Configuration groups for various modules.
 */

exports.server = {
  environment: defaults.environment,
  logServiceErrors: defaults.logServiceErrors,
  port: defaults.port,
  hostname: 'elvis.com',
  fixedTime: defaults.fixedTime,
  testTimeoutMs: 20*1000
};

exports.logger = {
  environment: defaults.environment,
  level: defaults.logLevel,
  pretty: defaults.prettyLog,
  hostname: defaults.hostname
};

exports.db = knexfile[defaults.environment];
