'use strict';

module.exports = knex => {

  const serviceTable = 'services';
  const profileTable = 'profiles';
  const entityTable = 'entities';
  const actionTable = 'actions';

  function addCreatedModifiedDeletedTimestamp(table) {
    table.increments('id').primary();
    table.integer('created_epoch').notNullable().defaultTo(knex.raw('extract(\'epoch\' from now())'));
    table.integer('modified_epoch').notNullable().defaultTo(knex.raw('extract(\'epoch\' from now())'));
    table.integer('deleted_epoch').nullable();
  }

  function addModifyByDeletedByServiceRef(table) {
    addCreatedModifiedDeletedTimestamp(table);
    table.integer('modified_by');
    table.foreign('modified_by').references(`${profileTable}.id`);
    table.integer('deleted_by');
    table.foreign('deleted_by').references(`${profileTable}.id`);
    table.integer('service_id').nullable();
    table.foreign('service_id').references(`${serviceTable}.id`);
  }

  function addProfileReference(table) {
    table.integer('profile_id');
    table.foreign('profile_id').references(`${profileTable}.id`);
  }

  function addActivePeriod(table) {
    table.integer('start_epoch').nullable();
    table.integer('end_epoch').nullable();
  }

  function createServiceTable() {
    return knex.schema.createTable(serviceTable, table => {
      addCreatedModifiedDeletedTimestamp(table);
      table.string('name').notNullable();
      table.json('attributes').nullable();
    });
  }

  function createProfileTable() {
    return knex.schema.createTable(profileTable, table => {
      addModifyByDeletedByServiceRef(table);
      table.string('name').notNullable();
      table.json('attributes').nullable();
      table.json('log').nullable();
    });
  }

  function createEntityTable() {
    return knex.schema.createTable(entityTable, table => {
      addModifyByDeletedByServiceRef(table);
      addProfileReference(table);
      addActivePeriod(table);
      table.integer('parent_id');
      table.foreign('parent_id').references(`${entityTable}.id`);
      table.string('type').notNullable();
      table.string('title').notNullable();
      table.string('contents').notNullable();
      table.json('attributes').nullable();
      table.json('log').nullable();
    });
  }

  function createActionTable() {
    return knex.schema.createTable(actionTable, table => {
      addModifyByDeletedByServiceRef(table);
      addProfileReference(table);
      addActivePeriod(table);
      table.integer('entity_id');
      table.foreign('entity_id').references(`${entityTable}.id`);
      table.string('type').notNullable();
      table.json('attributes').nullable();
    });
  }

  function setup() {
    return Promise.all([
      createServiceTable(knex)
      .then(() => {
        return createProfileTable(knex);
      })
      .then(() => {
        return createEntityTable(knex);
      })
      .then(() => {
        return createActionTable(knex);
      })
    ]);
  }

  function destroy() {
    return Promise.all([
      knex.schema.dropTableIfExists(actionTable)
      .then(() => {
        return knex.schema.dropTableIfExists(entityTable);
      })
      .then(() => {
        return knex.schema.dropTableIfExists(profileTable);
      })
      .then(() => {
        return knex.schema.dropTableIfExists(serviceTable);
      })
    ]);
  }

  return {
    setup,
    destroy
  };
};
