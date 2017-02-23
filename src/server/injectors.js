/*
 * Common injection functions for the API.
 */

'use strict';

const config = require('server/config');
const knex = require('knex')(config.db);

function gettingCurrentTimeAsEpoch() {
  return new Promise((resolve, reject) => {
    knex.select(knex.raw('extract(\'epoch\' from CURRENT_TIMESTAMP)'))
    .then(response => {
      try {
        // Apparently PostgreSQL uses rounding when putting a float in an int column.
        const epoch = Math.round(response[0].date_part);
        resolve(epoch);
      }
      catch (error) {
        reject(error);
      }
    })
    .catch(error => {
      reject(error);
    });
  });
}
exports.gettingCurrentTimeAsEpoch = gettingCurrentTimeAsEpoch;

function setCommunityId(object, communityId) {
  return Object.assign(object, {
    community_id: communityId
  });
}
exports.setCommunityId = setCommunityId;

function setModifiedEpoch(object, epoch) {
  return Object.assign(object, {
    modified_epoch: epoch
  });
}
exports.setModifiedEpoch = setModifiedEpoch;

function setDeletedBy(object, who, epoch) {
  return Object.assign(object, {
    deleted_epoch: epoch,
    deleted_by: who
  });
}
exports.setDeletedBy = setDeletedBy;

function setModifiedBy(object, who, epoch) {
  return Object.assign(setModifiedEpoch(object, epoch), {
    modified_epoch: epoch,
    modified_by: who
  });
}
exports.setModifiedBy = setModifiedBy;

function updateModificationLog(update, before, logEntry) {
  let modifiactionLog = before.log;
  if (!modifiactionLog) {
    modifiactionLog = [];
  }
  modifiactionLog.push(logEntry);
  update.log = JSON.stringify(modifiactionLog);
  return update;
}
exports.updateModificationLog = updateModificationLog;
