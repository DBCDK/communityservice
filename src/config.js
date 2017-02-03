'use strict';

const tcp = require('__/tcp');
const hostname = require('os').hostname;

// This is the only place to read process.env settings.  The point is that
// the server should use the configuration like
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
  let dbHost = process.env.DB_HOST;
  let dbName = process.env.DB_NAME;
  let dbUser = process.env.DB_USER;
  let dbUserPassword = process.env.DB_USER_PASSWORD;
  let dbPoolMin = process.env.DB_CONNECTIONS_POOL_MIN;
  let dbPoolMax = process.env.DB_CONNECTIONS_POOL_MAX;
  if (environment === 'development') {
    port = 3001;
  }
  return {
    environment,
    hostname: hostname(),
    port,
    prettyLog,
    logLevel,
    dbHost,
    dbName,
    dbUser,
    dbUserPassword,
    dbPoolMin,
    dbPoolMax
  };
}

const defaults = new Defaults();

/*
 * Configuration groups for various modules.
 */

exports.server = {
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

exports.db = {
  host: defaults.dbHost,
  name: defaults.dbName,
  user: defaults.dbUser,
  password: defaults.dbUserPassword,
  minPool: defaults.dbPoolMin,
  maxPool: defaults.dbPoolMax
};
