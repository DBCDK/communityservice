'use strict';

const serviceTable = 'services';

exports.seed = (knex, Promise) => {
  return knex(serviceTable).del()
    .then(() => {
      return Promise.all([
        knex(serviceTable).insert({id: 1, name: 'Biblo'}),
        knex(serviceTable).insert({id: 2, name: 'LiteraturSiden'})
      ]);
    });
};
