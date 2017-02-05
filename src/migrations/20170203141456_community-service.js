'use strict';

const serviceTable = 'services';

exports.up = (knex, Promise) => { // eslint-disable-line no-unused-vars
  return knex.schema.createTable(serviceTable, table => {
    table.increments();
    table.timestamps();
    table.timestamp('deleted_at').nullable();
    table.string('name').notNullable();
    table.jsonb('attributes').nullable();
  });
};

exports.down = (knex, Promise) => { // eslint-disable-line no-unused-vars
  return knex.schema.dropTable(serviceTable);
};
