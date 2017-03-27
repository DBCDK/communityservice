'use strict';

const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const logger = require('__/logging')(config.logger);

knex.migrate.latest()
.then(() => {
  process.exit(0);
})
.catch(error => {
  logger.log.error(error);
  process.exit(1);
});
