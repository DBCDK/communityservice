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
    case 'CountProfiles': return count(request, 'CountProfiles', constants.profile);
    case 'CountActions': return count(request, 'CountActions', constants.action);
    case 'CountEntities': return count(request, 'CountEntities', constants.entity);
    case 'Profile': return singleton(request, 'Profile', constants.profile);
    case 'Action': return singleton(request, 'Action', constants.action);
    case 'Entity': return singleton(request, 'Entity', constants.entity);
    default: return Promise.reject(
      new QueryParserError([{
        problem: `Not handled: ${commonKeys[0]}`,
        query: request
      }])
    );
  }
};

function count(request, selector, defs) {
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
  const parseResult = buildWhereClause(criteria, defs.keys, defs.timeKeys);
  if (!_.isEmpty(parseResult.errors)) {
    return Promise.reject(
      new QueryParserError(parseResult.errors)
    );
  }
  return Promise.resolve(context => {
    let querying = knex(defs.table).count();
    try {
      querying = parseResult.queryingModifier(context, querying);
    }
    catch (dynError) {
      return Promise.reject(dynError);
    }
    // console.log(querying.toString());
    return querying.select()
      .then(results => {
        if (results.length !== 1) {
          throw new QueryServerError('No result from query', request, context);
        }
        const result = results[0].count;
        const number = parseInt(result, 10);
        if (_.isNaN(number)) {
          throw new QueryServerError(
            `Expected a count as result from query, got ${result}`,
            request,
            context
          );
        }
        return number;
      });
  });
}

function singleton(request, selector, defs) {
  const keys = _.pull(_.keys(request), selector);
  const extractors = ['Include', 'IncludeSwitch', 'IncludeEntitiesRecursively'];
  const extractor = _.intersection(keys, extractors);
  let errors = [];
  if (extractor.length !== 1) {
    errors.push({
      problem: `a singleton selector must have exactly one extractor: ${extractors.join(', ')}`,
      query: request
    });
  }
  _.pullAll(keys, extractor);
  if (keys.length > 0) {
    errors.push({
      problem: `a singleton selector must not have additional properties, but found: ${keys}`,
      query: request
    });
  }
  if (errors.length > 0) {
    return Promise.reject(new QueryParserError(errors));
  }
  const criteria = request[selector];
  const parseResult = buildWhereClause(criteria, defs.keys, defs.timeKeys);
  let extractorResult = buildExtractor(extractor[0], request[extractor[0]], defs);
  if (!_.isEmpty(parseResult.errors) || !_.isEmpty(extractorResult.errors)) {
    return Promise.reject(new QueryParserError(
      _.concat(parseResult.errors, extractorResult.errors)
    ));
  }
   // TODO:
  //
  return willSucceed('Not implemented');
}

function buildExtractor(extractor, rhs, defs) {
  let errors = [];
  // TODO:
  const extractorObj = {};
  extractorObj[extractor] = rhs;
  errors.push({
    problem: `Not implemented: ${extractor}`,
    query: extractorObj
  });
  return ParserErrors(errors);
/*
  switch (extractor[0]) {
    case 'Include': extract = ;
    case 'IncludeSwitch': return willSucceed('Not implemented');
    case 'IncludeEntitiesRecursively': return willSucceed('Not implemented');
    default: return Promise.reject(
      new QueryParserError([{
        problem: `Not handled: ${extractor[0]}`,
        query: request
      }])
    );
  }
  */
}

function buildWhereClause(criteria, keys, timeKeys) {
  if (_.isEmpty(criteria)) {
    return QueryingModifier((context, querying) => querying);
  }
  let errors = [];
  const modifier = _.reduce(criteria, (mod, value, key) => {
    // TODO: figure out how to search in a json column in PostgresSQL with knex.
    if (key.match('^attributes\\.')) {
      errors.push({
        problem: `attribute matching not implemented: ${key}`,
        query: criteria
      });
      return (context, modi) => modi;
    }
    if (_.includes(timeKeys, key)) {
      const ks = _.keys(value);
      if (
        ks.length !== 3 ||
        !_.includes(ks, 'operator') ||
        !_.includes(ks, 'unit') ||
        !_.includes(ks, 'value')
      ) {
        errors.push({
          problem: 'Exactly three properties expected in time-based comparison: operator, unit & value',
          query: value
        });
        return (context, modi) => modi;
      }
      if (value.operator !== 'newerThan' && value.operator !== 'olderThan') {
        errors.push({
          problem: 'operator must be one of: newerThan, olderThan',
          query: value
        });
      }
      if (value.unit !== 'daysAgo') {
        errors.push({
          problem: 'unit must be one of: daysAgo',
          query: value
        });
      }
      const daysAgo = parseInt(value.value, 10);
      if (_.isNaN(daysAgo)) {
        errors.push({
          problem: 'value must be a number',
          query: value
        });
      }
      if (!_.isEmpty(errors)) {
        return (context, modi) => modi;
      }
      // TODO: Implement nowEpoch.
      const nowEpoch = 1489397775;
      const pointInTimeEpoch = nowEpoch - (daysAgo * 3600 * 24);
      if (value.operator === 'olderThan') {
        return (context, querying) => {
          return mod(context, querying).where('modified_epoch', '<', pointInTimeEpoch);
        };
      }
      return (context, querying) => {
        return mod(context, querying).where('modified_epoch', '>=', pointInTimeEpoch);
      };
    }
    if (_.isNil(_.find(keys, pattern => key.match(pattern)))) {
      errors.push({
        problem: `unknown key ${key}`,
        query: criteria
      });
    }
    if (_.startsWith(value, '^')) {
      const reference = _.trim(value, '^');
      // look for reference in context
      return (context, querying) => {
        if (!_.has(context, reference)) {
          throw new QueryDynamicError(
            `reference ${value} does not exist in current context`,
            criteria,
            context
          );
        }
        const valueOfRef = context[reference];
        const q = mod(context, querying).where(key, valueOfRef);
        // console.log(q.toString());
        return q;
      };
    }
    if (!_.isEmpty(errors)) {
      return (context, modi) => modi;
    }
    return (context, querying) => {
      return mod(context, querying).where(key, value);
    };
  }, (context, querying) => querying);
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

function willFail(message, query) {
  return Promise.resolve(context => {
    return Promise.reject(
      new QueryServerError(message, query, context)
    );
  });
}

function QueryingModifier(queryingModifier) {
  if (typeof queryingModifier !== 'function') {
    throw `Expected function, got ${JSON.stringify(queryingModifier)}`;
  }
  return {
    errors: [],
    queryingModifier
  };
}

function ParserErrors(errors) {
  errors.forEach(error => {
    if (!_.has(error, 'problem') || !_.has(error, 'query')) {
      throw new Error(`expected at least properties 'problem' and 'query': ${errors}`);
    }
  });
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

class QueryServerError extends Error {
  constructor(message, query, context) {
    super(message);
    this.name = 'QueryServerError';
    this.query = query;
    this.context = context;
  }
}

module.exports = exports = request => {
  return this.builder(request);
};
