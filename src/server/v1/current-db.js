'use strict';

const constants = require('server/constants')();
const communityTable = constants.communityTable;
const profileTable = constants.profileTable;
const entityTable = constants.entityTable;
const actionTable = constants.actionTable;

module.exports = knex => {

  function addCreatedModifiedDeletedTimestamp(table) {
    table.increments('id').primary();
    table.integer('created_epoch').notNullable().defaultTo(knex.raw('extract(\'epoch\' from now())'));
    table.integer('modified_epoch').nullable();
    table.integer('deleted_epoch').nullable();
  }

  function addModifyByDeletedByCommunityRef(table) {
    addCreatedModifiedDeletedTimestamp(table);
    table.integer('modified_by');
    table.foreign('modified_by').references(`${profileTable}.id`);
    table.integer('deleted_by');
    table.foreign('deleted_by').references(`${profileTable}.id`);
    table.integer('community_id').notNullable();
    table.foreign('community_id').references(`${communityTable}.id`);
  }

  function addOwner(table) {
    table.integer('owner_id').notNullable();
    table.foreign('owner_id').references(`${profileTable}.id`);
  }

  function addActivePeriod(table) {
    table.integer('start_epoch').nullable();
    table.integer('end_epoch').nullable();
  }

  function createcommunityTable() {
    return knex.schema.createTable(communityTable, table => {
      addCreatedModifiedDeletedTimestamp(table);
      table.string('name').unique();
      table.json('attributes').notNullable().defaultTo('{}');
    });
  }

  function createProfileTable() {
    return knex.schema.createTable(profileTable, table => {
      addModifyByDeletedByCommunityRef(table);
      table.string('name').notNullable();
      table.json('attributes').notNullable().defaultTo('{}');
      table.json('log').nullable();
    });
  }

  function createEntityTable() {
    return knex.schema.createTable(entityTable, table => {
      addModifyByDeletedByCommunityRef(table);
      addOwner(table);
      addActivePeriod(table);
      table.integer('entity_ref').nullable();
      table.foreign('entity_ref').references(`${entityTable}.id`);
      table.string('type').notNullable();
      table.string('title').notNullable();
      table.text('contents').notNullable();
      table.json('attributes').notNullable().defaultTo('{}');
      table.json('log').nullable();
    });
  }

  function createActionTable() {
    return knex.schema.createTable(actionTable, table => {
      addModifyByDeletedByCommunityRef(table);
      addOwner(table);
      addActivePeriod(table);
      table.integer('entity_ref').nullable();
      table.foreign('entity_ref').references(`${entityTable}.id`);
      table.integer('profile_ref').nullable();
      table.foreign('profile_ref').references(`${profileTable}.id`);
      table.string('type').notNullable();
      table.json('attributes').notNullable().defaultTo('{}');
    });
  }

  function setup() {
    return createcommunityTable(knex)
    .then(() => {
      return createProfileTable(knex);
    })
    .then(() => {
      return createEntityTable(knex);
    })
    .then(() => {
      return createActionTable(knex);
    });
  }

  function clear() {
    return knex.raw(
      `truncate table ${actionTable}, ${entityTable}, ${profileTable}, ${communityTable} cascade`
    );
  }

  function destroy() {
    return knex.schema.dropTableIfExists(actionTable)
    .then(() => {
      return knex.schema.dropTableIfExists(entityTable);
    })
    .then(() => {
      return knex.schema.dropTableIfExists(profileTable);
    })
    .then(() => {
      return knex.schema.dropTableIfExists(communityTable);
    });
  }

  return {
    setup,
    destroy,
    clear
  };
};
