'use strict';

const serviceTable = 'services';

exports.up = (knex, Promise) => { // eslint-disable-line no-unused-vars
  return knex.schema.createTable(serviceTable, table => {
    table.increments('id').primary();
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('date_trunc(\'second\',now())'));
    table.timestamp('updated_at').notNullable().defaultTo(knex.raw('date_trunc(\'second\',now())'));
    table.timestamp('deleted_at').nullable();
    table.string('name').notNullable();
    table.json('attributes').nullable();
  });
};

exports.down = (knex, Promise) => { // eslint-disable-line no-unused-vars
  return knex.schema.dropTable(serviceTable);
};
