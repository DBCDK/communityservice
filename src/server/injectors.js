/*
 * Common injection functions for the API.
 */

'use strict';

const config = require('server/config');
const knex = require('knex')(config.db);

const logger = require('__/logging')(config.logger);

function setCommunityId(object, communityId) {
  return Object.assign(object, {
    community_id: communityId
  });
}
exports.setCommunityId = setCommunityId;

function setModifiedEpoch(object) {
  return Object.assign(object, {
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

function updateModificationLog(update, before, logEntry) {
  let modifiactionLog = before.log;
  if (!modifiactionLog) {
    modifiactionLog = [];
  }
  modifiactionLog.push(logEntry);
  //logger.log.debug(update.log);
  const object = setModifiedEpoch(update);
  // const object = update;
  //logger.log.debug(object);
  object.log = JSON.stringify(modifiactionLog);
  return object;
}
exports.updateModificationLog = updateModificationLog;
