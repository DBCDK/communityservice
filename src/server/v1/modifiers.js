/*
 * Common object modifier functions for the API.
 */

'use strict';

const config = require('server/config');
const knex = require('knex')(config.db);
const _ = require('lodash');

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
// exports.setDeletedBy = setDeletedBy;

function setModifiedBy(object, who, epoch) {
  return Object.assign(setModifiedEpoch(object, epoch), {
    modified_epoch: epoch,
    modified_by: who
  });
}
// exports.setModifiedBy = setModifiedBy;

function updateModificationLog(update, before, logEntry) {
  let modifiactionLog = before.log;
  if (!modifiactionLog) {
    modifiactionLog = [];
  }
  modifiactionLog.push(logEntry);
  update.log = JSON.stringify(modifiactionLog);
  return update;
}
// exports.updateModificationLog = updateModificationLog;

function getMinimalDifference(after, before) {
  if (typeof after === typeof before) {
    if (typeof after === 'object') {
      const diff = _.omitBy(before, (v, k) => {
        return after[k] === v;
      });
      if (_.isEmpty(diff)) {
        return null;
      }
      return diff;
    }
    else if (after === before) {
      return null;
    }
  }
  return before;
}
// exports.getMinimalDifference = getMinimalDifference;

function updateOrDelete(after, before, epochNow, potentialKeys) {
  const afters = _.toPairs(after);
  if (afters.length === 1) {
    // Delete instead of update modify.
    return setDeletedBy(before, after.modified_by, epochNow);
  }
  let logEntry = setModifiedBy({}, after.modified_by, epochNow);
  // const potentialKeys = ['name', 'attributes'];
  const keys = _.intersection(_.keys(after), potentialKeys);
  const oldKeyValues = _.pick(before, keys);
  _.forEach(oldKeyValues, (value, key) => {
    const diffValue = getMinimalDifference(after[key], value);
    if (diffValue) {
      logEntry[key] = diffValue;
    }
  });
  let update = setModifiedBy(after, after.modified_by, epochNow);
  update = updateModificationLog(update, before, logEntry);
  return update;
}
exports.updateOrDelete = updateOrDelete;
