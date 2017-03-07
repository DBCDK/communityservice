/*
 * Common object modifier functions for the API.
 */

'use strict';

const config = require('server/config');
const knex = require('knex')(config.db);
const _ = require('lodash');

/**
 * [gettingCurrentTimeAsEpoch description]
 * @return {[type]} [description]
 */
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

/**
 * Prepare an object so that it can be used in a SQL row `update`.
 * The property `attributes` gets special treatment in that each attribute in this object
 * is also treated as an update to the existing attributes.  To delete an attribute,
 * set it to null.
 *
 * The effective changes are logged into the `log` array.
 * @param  {[type]} change      Values to change or add.
 * @param  {[type]} before      Object as it were before the change.
 * @param  {[type]} epochNow    Timestamp for change.
 * @param  {[type]} loggedKeys  Changes to these properties are recorded in log.
 * @return {[type]}             Object to use in SQL update query.
 */
function updateOrDelete(change, before, epochNow, loggedKeys) {
  const changeKeys = _.keys(change);
  if (changeKeys.length === 1 && changeKeys[0] === 'modified_by') {
    // Delete instead of update modify.
    return setDeletedBy({}, change.modified_by, epochNow);
  }
  let logEntry = setModifiedBy({}, change.modified_by, epochNow);
  const keys = _.intersection(_.keys(change), loggedKeys);
  const oldKeyValues = _.pick(before, keys);
  _.forEach(oldKeyValues, (value, key) => {
    const diffValue = getMinimalDifference(change[key], value);
    if (diffValue) {
      logEntry[key] = diffValue;
    }
  });
  let update = setModifiedBy(change, change.modified_by, epochNow);
  // Fill in old attribute values if not mentioned in update.
  fillInOldAttributes(update.attributes, before.attributes);
  update = updateModificationLog(update, before, logEntry);
  return update;
}
exports.updateOrDelete = updateOrDelete;

function updateCommunity(change, before) {
  // Fill in old attribute values if not mentioned in update.
  fillInOldAttributes(change.attributes, before.attributes);
  return change;
}
exports.updateCommunity = updateCommunity;

function fillInOldAttributes(update, before) {
  _.defaults(update, before);
  _.forEach(update, (value, key) => {
    if (value === null) {
      _.unset(update, key);
    }
  });
  return update;
}

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

function setModifiedBy(object, who, epoch) {
  return Object.assign(setModifiedEpoch(object, epoch), {
    modified_epoch: epoch,
    modified_by: who
  });
}

function updateModificationLog(update, before, logEntry) {
  let modificationLog = before.log;
  if (!modificationLog) {
    modificationLog = [];
  }
  modificationLog.push(logEntry);
  update.log = JSON.stringify(modificationLog);
  return update;
}

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
