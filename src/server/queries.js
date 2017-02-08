'use strict';

const config = require('server/config');
// const logger = require('__/logging')(config.logger);
// logger.log.debug('knex conf', config.db);
const knex = require('knex')(config.db);

function Communities() {
  return knex('communities');
}

function getAll() {
  const query = Communities().select();
  // logger.log.debug({query: query.toString()});
  return query;
}

module.exports = {
  getAll
};
