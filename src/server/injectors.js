/*
 * Common injection functions for the API.
 */

'use strict';

const config = require('server/config');
const knex = require('knex')(config.db);

function setCommunityId(object, communityId) {
  return Object.assign(object, {
    community_id: communityId
  });
}
exports.setCommunityId = setCommunityId;

function setModifiedEpoch(community) {
  return Object.assign(community, {
    modified_epoch: knex.raw('extract(\'epoch\' from now())')
  });
}
exports.setModifiedEpoch = setModifiedEpoch;

function setModifiedByAndEpoch(object, who) {
  return Object.assign(object, {
    modified_epoch: knex.raw('extract(\'epoch\' from now())'),
    modified_by: who
  });
}
exports.setModifiedByAndEpoch = setModifiedByAndEpoch;
