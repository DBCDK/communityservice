'use strict';

const tcp = require('__/tcp');
const hostname = require('os').hostname;
const knexfile = require('./knexfile');

// This (and knexfile) is the only place to read process.env settings.  The
// point is that the server should use the configuration like
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
  let port = tcp.normalizePort(process.env.PORT) || 3000;
  let prettyLog = process.env.PRETTY_LOG || 1;
  let logLevel = process.env.LOG_LEVEL || 'INFO';
  return {
    environment,
    hostname: hostname(),
    port,
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
  port: defaults.port,
  hostname: 'elvis.com',
  testTimeoutMs: 20*1000
};

exports.logger = {
  environment: defaults.environment,
  level: defaults.logLevel,
  pretty: defaults.prettyLog,
  hostname: defaults.hostname
};

exports.db = knexfile[defaults.environment];
