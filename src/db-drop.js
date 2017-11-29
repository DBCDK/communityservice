#!/usr/bin/env node
'use strict';

const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const logger = require('__/logging')(config.logger);
const db = require('acceptance/cleanup-db')(knex);

db.droppingAll()
.then(() => {
  process.exit(0);
})
.catch(error => {
  logger.log.error(error);
  process.exit(1);
});
