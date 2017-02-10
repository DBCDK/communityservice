'use strict';

module.exports = {
  development: {
    client: 'pg',
    connection: 'postgres://localhost/elvis',
    migrations: {
      directory: 'migrations'
    },
    seeds: {
      directory: 'server/seeds'
    }
  },
  vm: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_USER_PASSWORD
    },
    migrations: {
      directory: 'migrations'
    },
    seeds: {
      directory: 'seeds'
    }
  },
  ci: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_USER_PASSWORD
    },
    migrations: {
      directory: 'migrations'
    },
    seeds: {
      directory: 'seeds'
    }
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
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
    },
    seeds: {
      directory: 'seeds'
    }
  }
};
