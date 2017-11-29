'use strict';

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME || 'communityservice',
      user: process.env.DB_USER || 'communityservice',
      password: process.env.DB_USER_PASSWORD
    },
    migrations: {
      directory: 'migrations'
    },
    seeds: {
      directory: 'server/seeds'
    }
  },
  ci: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME || 'communityservice',
      user: process.env.DB_USER || 'communityservice',
      password: process.env.DB_USER_PASSWORD
    },
    migrations: {
      directory: 'migrations'
    },
    seeds: {
      directory: 'server/seeds'
    }
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_USER_PASSWORD
    },
    pool: {
      min: process.env.DB_CONNECTIONS_POOL_MIN || 2,
      max: process.env.DB_CONNECTIONS_POOL_MAX || 10
    },
    migrations: {
      directory: 'migrations'
    }
  }
};
