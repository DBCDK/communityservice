'use strict';

const constants = require('server/constants')();
const communityTable = constants.community.table;
const profileTable = constants.profile.table;
const entityTable = constants.entity.table;
const actionTable = constants.action.table;

module.exports = knex => {

  function addCreatedDeletedTimestamp(table) {
    table.increments('id').primary();
    table.integer('created_epoch').notNullable().defaultTo(knex.raw('extract(\'epoch\' from now())'));
    table.integer('deleted_epoch').nullable();
  }

  function addModifyByDeletedByCommunityRef(table) {
    addCreatedDeletedTimestamp(table);
    table.integer('modified_epoch').notNullable().defaultTo(knex.raw('extract(\'epoch\' from now())'));
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
      addCreatedDeletedTimestamp(table);
      table.string('name').unique();
      table.jsonb('attributes').notNullable().defaultTo('{}');
      table.jsonb('log').nullable();
    });
  }

  function createProfileTable() {
    return knex.schema.createTable(profileTable, table => {
      addModifyByDeletedByCommunityRef(table);
      table.string('name').notNullable();
      table.jsonb('attributes').notNullable().defaultTo('{}');
      table.jsonb('log').nullable();
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
      table.jsonb('attributes').notNullable().defaultTo('{}');
      table.jsonb('log').nullable();
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
      table.jsonb('attributes').notNullable().defaultTo('{}');
      table.jsonb('log').nullable();
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
