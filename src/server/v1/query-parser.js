'use strict';

const _ = require('lodash');
const config = require('server/config');
const knex = require('knex')(config.db);
const constants = require('server/constants')();

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
      new QueryParserError([{
        problem: `a query must have exactly one selector: ${selectors.join(', ')}`,
        query: request
      }])
    );
  }
  switch (commonKeys[0]) {
    case 'CountProfiles': return count({}, request, 'CountProfiles', constants.profile);
    case 'CountActions': return count({}, request, 'CountActions', constants.action);
    case 'CountEntities': return count({}, request, 'CountEntities', constants.entity);
    case 'Profile': return singleton({}, request, 'Profile');
    case 'Action': return singleton({}, request, 'Action');
    case 'Entity': return singleton({}, request, 'Entity');
    default: return Promise.reject(
      new QueryParserError([{
        problem: `Not handled: ${commonKeys[0]}`,
        query: request
      }])
    );
  }
};

function count(env, request, selector, defs) {
  const keys = _.pull(_.keys(request), selector);
  if (keys.length > 0) {
    return Promise.reject(
      new QueryParserError([{
        problem: `a count selector cannot have any limitors or extractors, but found: ${keys.join(', ')}`,
        query: request
      }])
    );
  }
  const criteria = request[selector];
  const parseResult = buildWhereClause(env, criteria, defs.keys);
  if (!_.isEmpty(parseResult.errors)) {
    return Promise.reject(
      new QueryParserError(parseResult.errors)
    );
  }
  return Promise.resolve(context => { // eslint-disable-line no-unused-vars
    let querying = knex(defs.table).count();
    querying = parseResult.queryingModifier(querying);
    // console.log(querying.toString());
    return querying.select()
      .then(results => {
        if (results.length !== 1) {
          throw new QueryDynamicError('No result from query', request, context);
        }
        const result = results[0].count;
        const number = parseInt(result, 10);
        if (_.isNaN(number)) {
          throw new QueryDynamicError(
            `Expected a count as result from query, got ${result}`,
            request,
            context
          );
        }
        return number;
      });
  });
}

function singleton(context, request) { // eslint-disable-line no-unused-vars
  return willSucceed('Not implemented');
}

function buildWhereClause(context, criteria, keys) {
  if (_.isEmpty(criteria)) {
    return QueryingModifier(querying => querying);
  }
  let errors = [];
  const modifier = _.reduce(criteria, (mod, value, key) => {
    // TODO: figure out how to search in a json column.
    if (key.match('^attributes\\.')) {
      errors.push({
        problem: `attribute matching not implemented: ${key}`,
        query: criteria
      });
      return mod;
    }
    const m = _.find(keys, pattern => key.match(pattern));
    if (_.isNil(m)) {
      errors.push({
        problem: `unknown key ${key}`,
        query: criteria
      });
      return mod;
    }
    return querying => {
      return mod(querying).where(key, value);
    };
  }, querying => querying);
  if (_.isEmpty(errors)) {
    return QueryingModifier(modifier);
  }
  return ParserErrors(errors);
}

function willSucceed(message) {
  return Promise.resolve(context => { // eslint-disable-line no-unused-vars
    return Promise.resolve(message);
  });
}

/*
function willFail(message, query) {
  return Promise.resolve(context => {
    return Promise.reject(
      new QueryDynamicError(message, query, context)
    );
  });
}
*/

function QueryingModifier(queryingModifier) {
  return {
    errors: [],
    queryingModifier
  };
}

// TODO: enforce format
//        problem: `malformed criteria: ${JSON.stringify(criteria)}`,
//        query: request
function ParserErrors(errors) {
  return {
    errors,
    queryingModifier: querying => querying
  };
}

class QueryParserError extends Error {
  constructor(errors) {
    super('Query is malformed');
    this.name = 'QueryParserError';
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
