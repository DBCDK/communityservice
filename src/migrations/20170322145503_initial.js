'use strict';

/**
 * The initial database setup.
 */

const constants = require('server/constants')();
const communityTable = constants.community.table;
const profileTable = constants.profile.table;
const entityTable = constants.entity.table;
const actionTable = constants.action.table;

function addCreatedDeletedTimestamp(knex, table) {
  table.increments('id').primary();
  table.integer('created_epoch').notNullable().defaultTo(knex.raw('extract(\'epoch\' from now())'));
  table.integer('deleted_epoch').nullable();
}

function addModifyByDeletedByCommunityRef(knex, table) {
  addCreatedDeletedTimestamp(knex, table);
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

function createcommunityTable(knex) {
  return knex.schema.createTable(communityTable, table => {
    addCreatedDeletedTimestamp(knex, table);
    table.string('name').unique();
    table.jsonb('attributes').notNullable().defaultTo('{}');
    table.jsonb('log').nullable();
  });
}

function createProfileTable(knex) {
  return knex.schema.createTable(profileTable, table => {
    addModifyByDeletedByCommunityRef(knex, table);
    table.string('name').notNullable();
    table.jsonb('attributes').notNullable().defaultTo('{}');
    table.jsonb('log').nullable();
  });
}

function createEntityTable(knex) {
  return knex.schema.createTable(entityTable, table => {
    addModifyByDeletedByCommunityRef(knex, table);
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

function createActionTable(knex) {
  return knex.schema.createTable(actionTable, table => {
    addModifyByDeletedByCommunityRef(knex, table);
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

function setup(knex) {
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

function destroy(knex) {
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

exports.up = function(knex) {
  return setup(knex);
};

exports.down = function(knex) {
  return destroy(knex);
};
