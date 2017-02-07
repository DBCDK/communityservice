'use strict';

const serviceTable = 'services';

exports.up = (knex, Promise) => { // eslint-disable-line no-unused-vars
  return knex.schema.createTable(serviceTable, table => {
    table.increments('id').primary();
    table.integer('created_epoch').notNullable().defaultTo(knex.raw('extract(\'epoch\' from now())'));
    table.integer('modified_epoch').notNullable().defaultTo(knex.raw('extract(\'epoch\' from now())'));
    table.integer('deleted_epoch').nullable();
    table.string('name').notNullable();
    table.json('attributes').nullable();
  });
};

exports.down = (knex, Promise) => { // eslint-disable-line no-unused-vars
  return knex.schema.dropTable(serviceTable);
};
