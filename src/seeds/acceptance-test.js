'use strict';

const serviceTable = 'services';

exports.seed = (knex, Promise) => { // eslint-disable-line no-unused-vars
  return knex(serviceTable).del()
    .then(() => {
      return knex(serviceTable).insert({id: 1, name: 'Biblo'});
    })
    .then(() => {
      return knex(serviceTable).insert({id: 2, name: 'LiteraturSiden'});
    });
};
