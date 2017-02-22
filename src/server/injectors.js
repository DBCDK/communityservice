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

function setDeletedEpoch(object) {
  return Object.assign(object, {
    deleted_epoch: knex.raw('extract(\'epoch\' from now())')
  });
}
exports.setDeletedEpoch = setDeletedEpoch;

function setDeletedBy(object, who) {
  return Object.assign(setDeletedEpoch(object), {
    deleted_epoch: knex.raw('extract(\'epoch\' from now())'),
    deleted_by: who
  });
}
exports.setDeletedBy = setDeletedBy;
