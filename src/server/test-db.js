'use strict';

/**
 * Database manipulation for use when testing.
 */

const constants = require('server/constants')();
const communityTable = constants.community.table;
const profileTable = constants.profile.table;
const entityTable = constants.entity.table;
const actionTable = constants.action.table;

module.exports = knex => {

  /**
   * Truncate all tables in the current database.
   */
  function clear() {
    return knex.raw(
      `truncate table ${actionTable}, ${entityTable}, ${profileTable}, ${communityTable} cascade`
    );
  }

  /**
   * Completely clean up the database and migrations.
   */
  function dropAll() {
    return knex.schema.dropTableIfExists(actionTable)
      .then(() => {
        return knex.schema.dropTableIfExists(entityTable);
      })
      .then(() => {
        return knex.schema.dropTableIfExists(profileTable);
      })
      .then(() => {
        return knex.schema.dropTableIfExists(communityTable);
      })
      .then(() => {
        return knex.schema.dropTableIfExists('knex_migrations');
      })
      .then(() => {
        return knex.schema.dropTableIfExists('knex_migrations_lock');
      });
  }

  return {
    clear,
    dropAll
  };
};
