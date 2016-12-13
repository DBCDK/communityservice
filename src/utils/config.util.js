/**
 * @file
 * Config mapper that maps environment variables to the exportet CONFIG object.
 * A validateConfig method that validates the values found in the CONFIG object and throws an Error upon invalid values.
 */


export const CONFIG = {
  app: {
    env: process.env.NODE_ENV,
    port: Number(process.env.PORT),
    host: process.env.HOST
  },
  log: {
    level: process.env.LOG_LEVEL,
    pretty: process.env.PRETTY_LOG === '1'
  },
  mock_storage: process.env.MOCK_STORAGE === '1',
  postgres: {
    client: 'postgresql',
    connection: {
      host: process.env.CS_DB_HOST,
      database: process.env.CS_DB_NAME,
      user: process.env.CS_DB_USER,
      password: process.env.CS_DB_USER_PASSWORD,
      charset: 'utf8'
    },
    pool: {
      min: Number(process.env.CS_DB_CONNECTIONS_POOL_MIN),
      max: Number(process.env.CS_DB_CONNECTIONS_POOL_MAX)
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
};

/**
 * Recursive functon that validates that all params in the above CONFIG object is set.
 * Number are validated to be non-NaN numbers.
 *
 * @param {Object} config
 * @param {string} k String used for printing out which config param is missing
 */
export function validateConfig(config = CONFIG, k = '') {
  for (let key in config) {
    if (typeof config[key] === 'object') {
      validateConfig(config[key], `${key}.`);
    }
    else {
      if (config[key] === undefined) { // eslint-disable-line no-undefined
        throw Error(`${k}${key} was not specified in config. See https://github.com/DBCDK/communityservice#environment-variables for a list of environment variables and take a look at https://github.com/DBCDK/communityservice/blob/master/src/utils/config.util.js to see how they're mapped`); // eslint-disable-line max-len
      }
      if (typeof config[key] === 'number' && Number.isNaN(config[key])) {
        throw Error(`${k}${key}: expected NaN to be a number. See https://github.com/DBCDK/communityservice#environment-variables for a list of environment variables and take a look at https://github.com/DBCDK/communityservice/blob/master/src/utils/config.util.js to see how they're mapped`); // eslint-disable-line max-len
      }
    }
  }
}
