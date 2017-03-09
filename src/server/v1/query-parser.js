'use strict';

const _ = require('lodash');

/**
 * A recursive parser for query inputs for use in the community service.
 */

// In the rest of this file the input is called the 'request' and the promised
// operation on the database is called the 'query'.

/**
 * The parser function recursively parses a request and constructs a promise
 * of result (performed by database query).
 * @param  {object} request Object as described in doc/query-language.md.
 * @return {Promise}        Promise of a function that takes a context and returns a promise of a database result.
 */

exports.builder = request => {
  const selectors = [
    'CountProfiles', 'CountActions', 'CountEntities',
    'Profile', 'Action', 'Entity'
  ];
  const keys = _.keys(request);
  const commonKeys = _.intersection(selectors, keys);
  if (commonKeys.length !== 1) {
    return Promise.reject(
      new QueryParserErrors([{
        problem: `a query must have exactly one selector: ${selectors.join(', ')}`,
        query: JSON.stringify(request)
      }])
    );
  }
  switch (commonKeys[0]) {
    case 'CountProfiles': return willSucceed('Not implemented');
    case 'CountActions': return willSucceed('Not implemented');
    case 'CountEntities': return willSucceed('Not implemented');
    case 'Profile': return willSucceed('Not implemented');
    case 'Action': return willSucceed('Not implemented');
    case 'Entity': return willSucceed('Not implemented');
    default: return willFail(`Not handled: ${commonKeys[0]}`, request);
  }
};

function willSucceed(message) {
  return new Promise(resolve => {
    resolve(context => { // eslint-disable-line no-unused-vars
      return Promise.resolve(message);
    });
  });
}

function willFail(message, query) {
  return new Promise(resolve => {
    resolve(context => {
      return Promise.reject(
        new QueryDynamicError(message, query, context)
      );
    });
  });
}

class QueryParserErrors extends Error {
  constructor(errors) {
    super('Query is malformed');
    this.name = 'QueryParserErrors';
    this.errors = errors;
  }
}

class QueryDynamicError extends Error {
  constructor(message, query, context) {
    super(message);
    this.name = 'QueryDynamicError';
    this.query = query;
    this.context = context;
  }
}

module.exports = exports = request => {
  return this.builder(request);
};
