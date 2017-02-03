'use strict';

const config = require('server/config').db;

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: config.host,
      database: config.name,
      user: config.user,
      password: config.password
    },
    pool: {
      min: config.minPool,
      max: config.maxPool
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};
