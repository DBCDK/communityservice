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

// ParserResult = { error: ..., querying: ... }

/**
 * The parser function recursively parses a request and constructs a promise
 * of result (performed by database query).
 * @param  {object} request Object as described in doc/query-language.md.
 * @return {ParserResult}   Error or Promise of a function that takes a context and returns a promise of a database result.
 */

function builder(request) {
  const selectors = [
    'CountProfiles', 'CountActions', 'CountEntities',
    'Profiles', 'Actions', 'Entities',
    'Profile', 'Action', 'Entity'
  ];
  const keys = _.keys(request);
  const commonKeys = _.intersection(selectors, keys);
  if (commonKeys.length !== 1) {
    return ParserResultIsError([{
      problem: `a query must have exactly one selector: ${selectors.join(', ')}`,
      query: request
    }]);
  }
  switch (commonKeys[0]) {
    case 'CountProfiles': return count(request, 'CountProfiles', constants.profile);
    case 'CountActions': return count(request, 'CountActions', constants.action);
    case 'CountEntities': return count(request, 'CountEntities', constants.entity);
    case 'Profiles': return list(request, 'Profiles', constants.profile);
    case 'Actions': return list(request, 'Actions', constants.action);
    case 'Entities': return list(request, 'Entities', constants.entity);
    case 'Profile': return singleton(request, 'Profile', constants.profile);
    case 'Action': return singleton(request, 'Action', constants.action);
    case 'Entity': return singleton(request, 'Entity', constants.entity);
    default: return ParserResultIsError([{
      problem: `Not handled: ${commonKeys[0]}`,
      query: request
    }]);
  }
}

function count(request, selector, defs) {
  const keys = _.pull(_.keys(request), selector);
  if (keys.length > 0) {
    return ParserResultIsError([{
      problem: `a count selector cannot have any limitors or extractors, but found: ${keys.join(', ')}`,
      query: request
    }]);
  }
  const criteria = request[selector];
  const parseResult = buildWhereClause(criteria, defs.keys, defs.timeKeys);
  if (!_.isEmpty(parseResult.errors)) {
    return parseResult;
  }
  return ParserResultIsQuerying(context => {
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

function list(request, selector, defs) {
  const keys = _.pull(_.keys(request), selector);
  const extractor = _.intersection(keys, constants.extractors);
  let errors = [];
  if (extractor.length !== 1) {
    errors.push({
      problem: `a list selector must have exactly one extractor: ${constants.extractors.join(', ')}`,
      query: request
    });
  }
  _.pullAll(keys, extractor);
  if (!keys.includes('Limit')) {
    errors.push({
      problem: 'a list selector must have a Limit',
      query: request
    });
  }
  const limit = parseInt(request.Limit, 10);
  if (_.isNaN(limit)) {
    errors.push({
      problem: `a list selector must have a numeric Limit, but found: ${request.Limit}`,
      query: request
    });
  }
  // Defaults.
  let offset = 0;
  let sortBy = 'modified_epoch';
  let order = 'descending';
  const limitors = _.intersection(keys, constants.limitors);
  _.forEach(limitors, key => {
    switch (key) {
      case 'Offset':
        offset = parseInt(request.Offset, 10);
        if (_.isNaN(offset)) {
          errors.push({
            problem: `a list selector must have a numeric Offset, but found: ${request.Offset}`,
            query: request
          });
        }
        return;
      case 'Order':
        order = request.Order;
        if (order !== 'descending' && order !== 'ascending') {
          errors.push({
            problem: `a list selector must order descending or ascending, but found: ${order}`,
            query: request
          });
        }
        return;
      case 'SortBy':
        sortBy = request.SortBy.toString();
        if (
          !defs.timeKeys.includes(sortBy) &&
          _.isNil(_.find(defs.keys, pattern => sortBy.match(pattern)))
        ) {
          errors.push({
            problem: `a list selector must sort by known property, but found: ${sortBy}`,
            query: request
          });
        }
        return;
      default:
    }
  });
  _.pullAll(keys, limitors);
  if (keys.length > 0) {
    errors.push({
      problem: `a list selector must not have additional properties, but found: ${keys}`,
      query: request
    });
  }
  if (errors.length > 0) {
    return ParserResultIsError(errors);
  }
  const criteria = request[selector];
  const parseResult = buildWhereClause(criteria, defs.keys, defs.timeKeys);
  const extractorResult = buildExtractor(extractor[0], request[extractor[0]], defs);
  if (!_.isEmpty(parseResult.errors) || !_.isEmpty(extractorResult.errors)) {
    if (!_.isEmpty(parseResult.errors)) {
      errors = _.concat(errors, parseResult.errors);
    }
    if (!_.isEmpty(extractorResult.errors)) {
      errors = _.concat(errors, extractorResult.errors);
    }
    return ParserResultIsError(errors);
  }
  return ParserResultIsQuerying(context => {
    try {
      let counting = knex(defs.table).count();
      counting = parseResult.queryingModifier(context, counting);
      console.log(counting.toString());
      const knexOrder = (order === 'ascending') ? 'asc' : 'desc';
      let querying = knex(defs.table).orderBy(sortBy, knexOrder).limit(limit).offset(offset);
      querying = parseResult.queryingModifier(context, querying);
      console.log(querying.toString());

      return querying.select()
        .then(contexts => {
          return Promise.all(_.map(contexts, extractorResult.queryingProcessor));
        })
        .then(results => {
          return Promise.all([
            counting.select(),
            results
          ]);
        })
        .then(results => {
          const countResult = results[0];
          if (countResult.length !== 1) {
            // TODO: request, context?
            throw new QueryServerError('No result from query', request, context);
          }
          const number = countResult[0].count;
          const total = parseInt(number, 10);
          if (_.isNaN(total)) {
            // TODO: request, context?
            throw new QueryServerError(
              `Expected a count as result from query, got ${number}`,
              request,
              context
            );
          }
          const result = results[1];
          // const collected = result.length;
          let nextOffset = offset + limit;
          if (nextOffset >= total) {
            nextOffset = null;
          }
          return {
            Total: total,
            NextOffset: nextOffset,
            List: result
          };
        });
    }
    catch (dynError) {
      return Promise.reject(dynError);
    }
  });
}

function singleton(request, selector, defs) {
  const keys = _.pull(_.keys(request), selector);
  const extractor = _.intersection(keys, constants.extractors);
  let errors = [];
  if (extractor.length !== 1) {
    errors.push({
      problem: `a singleton selector must have exactly one extractor: ${constants.extractors.join(', ')}`,
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
    return ParserResultIsError(errors);
  }
  const criteria = request[selector];
  const parseResult = buildWhereClause(criteria, defs.keys, defs.timeKeys);
  const extractorResult = buildExtractor(extractor[0], request[extractor[0]], defs);
  if (!_.isEmpty(parseResult.errors) || !_.isEmpty(extractorResult.errors)) {
    if (!_.isEmpty(parseResult.errors)) {
      errors = _.concat(errors, parseResult.errors);
    }
    if (!_.isEmpty(extractorResult.errors)) {
      errors = _.concat(errors, extractorResult.errors);
    }
    return ParserResultIsError(errors);
  }
  return ParserResultIsQuerying(context => {
    let querying = knex(defs.table);
    try {
      querying = parseResult.queryingModifier(context, querying);
    }
    catch (dynError) {
      return Promise.reject(dynError);
    }
    // console.log(querying.toString());
    return querying.select()
      .then(results => {
        if (results.length === 0) {
          throw new QueryDynamicError('No result from singleton selector', criteria, context);
        }
        if (results.length > 1) {
          throw new QueryDynamicError('Several results from singleton selector', criteria, context);
        }
        const result = results[0];
        return extractorResult.queryingProcessor(result);
      });
  });
}

function buildExtractor(extractor, rhs, defs) {
  switch (extractor) {
    case 'Include': return include(rhs, defs);
    // TODO:
    // case 'IncludeSwitch': return QueryingProcessor(_.identity);
    // TODO:
    // case 'IncludeEntitiesRecursively': return QueryingProcessor(_.identity);
    default: return Promise.reject(
      new ParserResultIsError([{
        problem: `Not handled: ${extractor}`,
        query: extractor
      }])
    );
  }
}

function include(spec, defs) {
  const extractorObj = {Include: spec};
  if (typeof spec === 'string') {
    if (_.startsWith(spec, '^')) {
      // const reference = _.trim(value, '^');
      return ParserResultIsError([{
        problem: 'references not allowed in extractors',
        query: extractorObj
      }]);
    }
    if (
      defs.timeKeys.indexOf(spec) < 0 &&
      _.isNil(_.find(defs.keys, pattern => spec.match(pattern)))
    ) {
      return ParserResultIsError([{
        problem: `unknown key ${spec}`,
        query: extractorObj
      }]);
    }
    return ParserResultIsQueryingProcessor(context => {
      return _.get(context, spec);
    });
  }
  if (typeof spec !== 'object' || Object.prototype.toString.call(spec) === '[object Array]') {
    return ParserResultIsError([{
      problem: 'complex extractor must be an object',
      query: extractorObj
    }]);
  }
  let errors = [];
  // Process right-hand sides.
  let formular = {};
  _.forEach(spec, (value, key) => {
    if (typeof value === 'string') {
      if (_.startsWith(value, '^')) {
        // const reference = _.trim(value, '^');
        errors.push({
          problem: 'references not allowed in extractors',
          query: extractorObj
        });
        return;
      }
      if (
        defs.timeKeys.indexOf(value) < 0 &&
        _.isNil(_.find(defs.keys, pattern => value.match(pattern)))
      ) {
        errors.push({
          problem: `unknown key ${spec}`,
          query: extractorObj
        });
        return;
      }
      // Promise needed?
      formular[key] = context => Promise.resolve(_.get(context, value));
      return;
    }
    if (typeof value !== 'object' || Object.prototype.toString.call(value) === '[object Array]') {
      errors.push({
        problem: 'right-hand side of complex extractor must be a string or a subquery',
        query: value
      });
      return;
    }
    const subquery = builder(value);
    if (!_.isEmpty(subquery.errors)) {
      errors = _.concat(errors, subquery.errors);
      return;
    }
    // console.log(`subquery: ${subquery.querying}`);
    formular[key] = subquery.querying;
    return;
  });
  if (errors.length > 0) {
    return ParserResultIsError(errors);
  }
  return ParserResultIsQueryingProcessor(context => {
    const keys = [];
    const extractings = _.reduce(formular, (acc, value, key) => {
      keys.push(key);
      const extracting = value(context);
      acc.push(extracting);
      return acc;
    }, []);
    return Promise.all(extractings)
    .then(extractors => {
      return _.fromPairs(_.zip(keys, extractors));
    });
  });
}

function buildWhereClause(criteria, keys, timeKeys) {
  if (_.isEmpty(criteria)) {
    return ParserResultIsQueryingModifier((context, querying) => querying);
  }
  let errors = [];
  const modifier = _.reduce(criteria, (mod, value, key) => {
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
        return (context, querying) => querying;
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
        return (context, querying) => querying;
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
    if (key.match('^attributes\\.')) {
      const path = _.split(key, '.');
      if (path.length > 2) {
        errors.push({
          problem: `deep attribute paths are not supported: ${key}`,
          query: criteria
        });
        return;
      }
      return (context, querying) => {
        return mod(context, querying).whereRaw(`${path[0]}->>'${path[1]}' = '${value}'`);
      };
    }
    if (!_.isEmpty(errors)) {
      return (context, querying) => querying;
    }
    return (context, querying) => {
      return mod(context, querying).where(key, value);
    };
  }, (context, querying) => querying);
  if (_.isEmpty(errors)) {
    return ParserResultIsQueryingModifier(modifier);
  }
  return ParserResultIsError(errors);
}

function ParserResultIsError(errors) {
  errors.forEach(error => {
    if (!_.has(error, 'problem') || !_.has(error, 'query')) {
      throw new Error(`expected at least properties 'problem' and 'query': ${JSON.stringify(error)}`);
    }
  });
  return {
    errors,
    querying: null,
    queryingModifier: null,
    queryingProcessor: null
  };
}

function ParserResultIsQuerying(querying) {
  if (typeof querying !== 'function') {
    throw new Error(`expected 'querying' to be a function generating a promise: ${querying}`);
  }
  return {
    errors: null,
    querying,
    queryingModifier: null,
    queryingProcessor: null
  };
}

function ParserResultIsQueryingModifier(queryingModifier) {
  if (typeof queryingModifier !== 'function') {
    throw new Error(`expected 'queryingModifier' to be a function generating a promise: ${queryingModifier}`);
  }
  return {
    errors: null,
    querying: null,
    queryingModifier,
    queryingProcessor: null
  };
}

function ParserResultIsQueryingProcessor(queryingProcessor) {
  if (typeof queryingProcessor !== 'function') {
    throw new Error(`expected 'queryingProcessor' to be a function generating a promise: ${queryingProcessor}`);
  }
  return {
    errors: null,
    querying: null,
    queryingModifier: null,
    queryingProcessor
  };
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
  return builder(request);
};
