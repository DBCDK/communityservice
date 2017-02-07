'use strict';

const serviceTable = 'services';

exports.setup = knex => {
  return knex.schema.createTable(serviceTable, table => {
    table.increments('id').primary();
    table.integer('created_epoch').notNullable().defaultTo(knex.raw('extract(\'epoch\' from now())'));
    table.integer('modified_epoch').notNullable().defaultTo(knex.raw('extract(\'epoch\' from now())'));
    table.integer('deleted_epoch').nullable();
    table.string('name').notNullable();
    table.json('attributes').nullable();
  });
};

exports.destroy = knex => {
  return knex.schema.dropTableIfExists(serviceTable);
};
