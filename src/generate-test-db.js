'use strict';

const config = require('server/config');
const logger = require('__/logging')(config.logger);
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/test-db')(knex);
const seedBigDb = require('server/seeds/big').seed;

db.dropAll()
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
