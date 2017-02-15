'use strict';

const communityTable = 'communities';

exports.seed = (knex, Promise) => { // eslint-disable-line no-unused-vars
  return knex.raw(`alter sequence ${communityTable}_id_seq restart with 1`)
    .then(() => {
      return knex(communityTable).insert({
        name: 'Biblo'
      });
    })
    .then(() => {
      return knex(communityTable).insert({
        name: 'LitteraturSiden',
        attributes: {production: false}
      });
    });
};
