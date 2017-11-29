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
  function clearing () {
    return knex.raw(
      `truncate table ${actionTable}, ${entityTable}, ${profileTable}, ${communityTable} cascade`
    );
  }

  /**
   * Completely clean up the database and migrations.
   */
  async function droppingAll () {
    await knex.schema.dropTableIfExists(actionTable);
    await knex.schema.dropTableIfExists(entityTable);
    await knex.schema.dropTableIfExists(profileTable);
    await knex.schema.dropTableIfExists(communityTable);
  }

  return {
    clearing,
    droppingAll
  };
};
