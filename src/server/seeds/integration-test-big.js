'use strict';

const communityTable = 'communities';

exports.seed = (knex, Promise) => { // eslint-disable-line no-unused-vars
  return knex(communityTable).del()
    .then(() => {
      return knex(communityTable).insert({
        name: 'Biblo'
      });
    })
    .then(() => {
      return knex(communityTable).insert({
        name: 'LitteraturSiden',
        attributes: {produciton: false}
      });
    });
};
