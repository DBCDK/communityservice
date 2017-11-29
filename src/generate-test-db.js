'use strict';

const config = require('server/config');
const logger = require('__/logging')(config.logger);
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('acceptance/cleanup-db')(knex);
const seedBigDb = require('acceptance/big').seed;

db.dropingAll()
.then(() => {
  return knex.migrate.latest();
})
.then(seedBigDb)
.then(() => {
  process.exit(0);
})
.catch(error => {
  logger.log.error({failure: error});
  process.exit(1);
});
