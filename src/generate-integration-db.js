'use strict';

const config = require('server/config');
const logger = require('__/logging')(config.logger);
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/v1/current-db')(knex);
const seedBigDb = require('server/seeds/integration-big').seed;

db.destroy()
.then(db.setup)
.then(db.clear)
.then(seedBigDb)
.then(() => {
  process.exit(0);
})
.catch(error => {
  logger.log.error({failure: error});
  process.exit(1);
});
