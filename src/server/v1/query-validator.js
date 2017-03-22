'use strict';

const _ = require('lodash');

/**
 * A function that validates query input for use in the community service.
 * The function has an {error} property that is null after validation, or
 * contains an object that describes the errors.
 */

exports.errors = null;

// Assumes there is a Count property.
exports.count = object => {
  const keys = _.keys(object);
  _.pull(keys, 'Count');
  if (keys.length > 0) {
    exports.errors = [{
      data: object,
      problems: `unexpected properties: ${keys}`
    }];
    return false;
  }
  return true;
};

// Assumes there is a Singleton property.
exports.singleton = object => {
  const keys = _.keys(object);
  _.pull(keys, 'Singleton');
  const extractors = ['Include', 'Case'];
  const commonKeys = _.intersection(extractors, keys);
  if (commonKeys.length !== 1) {
    exports.errors = [{
      data: object,
      problems: `a Singleton selector should have exactly one of: ${extractors.join(', ')}`
    }];
    return false;
  }
  return true;
};

exports.list = object => {
  const keys = _.keys(object);
  _.pull(keys, 'List');
  const extractors = ['Include', 'Case'];
  const commonKeys = _.intersection(extractors, keys);
  if (commonKeys.length !== 1) {
    exports.errors = [{
      data: object,
      problems: `a List selector should have exactly one of: ${extractors.join(', ')}`
    }];
    return false;
  }
  if (!_.includes(keys, 'Limit')) {
    exports.errors = [{
      data: object,
      problem: 'a List selector should have a Limit property'
    }];
    return false;
  }
  return true;
};

exports.selector = object => {
  exports.errors = null;
  const selectors = ['Singleton', 'List', 'Count'];
  const keys = _.keys(object);
  const commonKeys = _.intersection(selectors, keys);
  if (commonKeys.length !== 1) {
    exports.errors = [{
      data: object,
      problem: `to be a selector, should have exactly one of: ${selectors.join(', ')}`
    }];
    return false;
  }
  switch (commonKeys[0]) {
    default:
    case 'Count': return this.count(object);
    case 'Singleton': return this.singleton(object);
    case 'List': return this.list(object);
  }
};

module.exports = exports = object => {
  return this.selector(object);
};
