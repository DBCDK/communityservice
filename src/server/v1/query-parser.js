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
 * @param  {request}  request Object as described in doc/query-language.md.
 * @param  {settings} parameters {options: [...], epochNow: 148...} controlling the search.
 * @return {ParserResult}   Error or Promise of a function that takes a context and returns a promise of a database result.
 */

function builder(request, settings) {
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
    case 'CountProfiles': return count(request, 'CountProfiles', constants.profile, settings);
    case 'CountActions': return count(request, 'CountActions', constants.action, settings);
    case 'CountEntities': return count(request, 'CountEntities', constants.entity, settings);
    case 'Profiles': return list(request, 'Profiles', constants.profile, settings);
    case 'Actions': return list(request, 'Actions', constants.action, settings);
    case 'Entities': return list(request, 'Entities', constants.entity, settings);
    case 'Profile': return singleton(request, 'Profile', constants.profile, settings);
    case 'Action': return singleton(request, 'Action', constants.action, settings);
    case 'Entity': return singleton(request, 'Entity', constants.entity, settings);
    default: return ParserResultIsError([{
      problem: `Not handled: ${commonKeys[0]}`,
      query: request
    }]);
  }
}

function count(request, selector, defs, settings) {
  const keys = _.pull(_.keys(request), selector);
  if (keys.length > 0) {
    return ParserResultIsError([{
      problem: `a count selector cannot have any limitors or extractors, but found: ${keys.join(', ')}`,
      query: request
    }]);
  }
  const criteria = request[selector];
  const parseResult = buildWhereClause(criteria, defs.keys, defs.timeKeys, settings);
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
    querying = modifyQueryAccordingToOptions(settings.options, querying);
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

function list(request, selector, defs, settings) {
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
  const parseResult = buildWhereClause(criteria, defs.keys, defs.timeKeys, settings);
  const extractorResult = buildExtractor(extractor[0], request[extractor[0]], defs, settings);
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
      counting = modifyQueryAccordingToOptions(settings.options, counting);
      // console.log(counting.toString());
      const knexOrder = (order === 'ascending') ? 'asc' : 'desc';
      let querying = knex(defs.table).orderBy(sortBy, knexOrder).limit(limit).offset(offset);
      querying = parseResult.queryingModifier(context, querying);
      querying = modifyQueryAccordingToOptions(settings.options, querying);
      // console.log(querying.toString());
      return querying.select()
        .then(contexts => {
          return Promise.all(_.map(contexts, extractorResult.queryingProcessor));
        })
        .then(results => {
          // Pass the real result together with the count of possible results.
          return Promise.all([
            counting.select(),
            results
          ]);
        })
        .then(results => {
          const countResult = results[0];
          if (countResult.length !== 1) {
            throw new QueryServerError('No result from query', request, context);
          }
          const number = countResult[0].count;
          const total = parseInt(number, 10);
          if (_.isNaN(total)) {
            throw new QueryServerError(
              `Expected a count as result from query, got ${number}`,
              request,
              context
            );
          }
          const result = results[1];
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

function singleton(request, selector, defs, settings) {
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
  const parseResult = buildWhereClause(criteria, defs.keys, defs.timeKeys, settings);
  const extractorResult = buildExtractor(extractor[0], request[extractor[0]], defs, settings);
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
      querying = modifyQueryAccordingToOptions(settings.options, querying);
      // console.log(querying.toString());
      return querying.select()
      .then(results => {
        if (results.length === 0) {
          throw new QueryDynamicError('No result from singleton selector', criteria, context);
        }
        if (results.length > 1) {
          throw new QueryDynamicError('Several results from singleton selector', criteria, context);
        }
        return results[0];
      })
      .then(extractorResult.queryingProcessor);
    }
    catch (dynError) {
      return Promise.reject(dynError);
    }
  });
}

function buildExtractor(extractor, rhs, defs, settings) {
  switch (extractor) {
    case 'Include': return include(rhs, defs, settings);
    case 'IncludeSwitch': return includeSwitch(rhs, defs, settings);
    case 'IncludeEntitiesRecursively': return includeEntitiesRecursively(rhs, defs, settings);
    default:
      throw {
        title: 'Internal error',
        problem: `Not handled: ${extractor}`,
        query: {extractor: rhs}
      };
  }
}

function includeEntitiesRecursively(spec, defs, settings) {
  const extractorObj = {IncludeEntitiesRecursively: spec};
  if (_.isNil(_.find(defs.keys, pattern => 'entity_ref'.match(pattern)))) {
    return ParserResultIsError([{
      problem: 'selected object does not have an entity_ref to follow',
      query: extractorObj
    }]);
  }
  if (typeof spec !== 'object' || Object.prototype.toString.call(spec) === '[object Array]') {
    return ParserResultIsError([{
      problem: `switch must be an object, but found: ${JSON.stringify(spec)}`,
      query: extractorObj
    }]);
  }
  let errors = [];
  const cases = _.mapValues(spec, rhs => {
    if (typeof rhs !== 'object' || Object.prototype.toString.call(rhs) === '[object Array]') {
      errors.push({
        problem: `simple extractors not allowed in recursive switch, but found: ${rhs}`,
        query: extractorObj
      });
    }
    // Accept keys from entities and whatever initiated the recursion.
    const defsIncludingEntities = {
      keys: _.concat(defs.keys, constants.entity.keys),
      timeKeys: _.concat(defs.timeKeys, constants.entity.timeKeys)
    };
    const cse = include(rhs, defsIncludingEntities, settings);
    if (!_.isEmpty(cse.errors)) {
      errors = _.concat(errors, cse.errors);
    }
    return cse.queryingProcessor;
  });
  if (!_.isEmpty(errors)) {
    return ParserResultIsError(errors);
  }
  return ParserResultIsQueryingProcessor(
    context => {
      return new Promise((resolve, reject) => {
        recursivelyExtractEntityRefs(cases, spec)(context)
        .then(bottomUpList => {
          resolve(_.reduce(bottomUpList, (acc, extraction) => {
            return _.fromPairs([[extraction[0], _.assign(extraction[1], acc)]]);
          }, {}));
        })
        .catch(reject);
      });
    }
  );
}

function recursivelyExtractEntityRefs(cases, spec) {
  return context => {
    return new Promise((resolve, reject) => {
      // console.log(`context: ${JSON.stringify(context)}`);
      const extractor = _.get(cases, context.type, ctx => {
        throw new QueryDynamicError(
          `entity type unhandled in switch: ${context.type}`,
          spec,
          ctx
        );
      });
      if (_.isNil(context.entity_ref)) {
        return extractor(context)
          .then(root => {
            // [type, extraction]]
            resolve([[context.type, root]]);
          })
          .catch(reject);
      }
      knex(constants.entity.table).where('id', context.entity_ref).select()
      .then(results => {
        if (results.length !== 1) {
          throw new QueryServerError(
            'Wrong result from following entity_ref',
            spec,
            context
          );
        }
        return results[0];
      })
      .then(recursivelyExtractEntityRefs(cases, spec))
      .then(bottomUp => {
        // Pass both the list of collected extractions and the next extraction.
        return Promise.all([
          bottomUp,
          extractor(context)
        ]);
      })
      .then(results => {
        const extraction = results[1];
        const bottomUp = _.concat([[context.type, extraction]], results[0]);
        resolve(bottomUp);
      })
      .catch(error => {
        reject(error);
      });
    });
  };
}

function includeSwitch(spec, defs, settings) {
  const extractorObj = {IncludeSwitch: spec};
  if (typeof spec !== 'object' || Object.prototype.toString.call(spec) === '[object Array]') {
    return ParserResultIsError([{
      problem: `switch must be an object, but found: ${JSON.stringify(spec)}`,
      query: extractorObj
    }]);
  }
  let errors = [];
  const cases = _.mapValues(spec, rhs => {
    const cse = include(rhs, defs, settings);
    if (!_.isEmpty(cse.errors)) {
      errors = _.concat(errors, cse.errors);
    }
    return cse.queryingProcessor;
  });
  if (!_.isEmpty(errors)) {
    return ParserResultIsError(errors);
  }
  return ParserResultIsQueryingProcessor(context => {
    const extractor = _.get(cases, context.type, ctx => {
      throw new QueryDynamicError(
        `entity type unhandled in switch: ${context.type}`,
        spec,
        ctx
      );
    });
    return extractor(context);
  });
}

function include(spec, defs, settings) {
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
        problem: `unknown key: ${spec}`,
        query: extractorObj
      }]);
    }
    return ParserResultIsQueryingProcessor(context => {
      if (_.isNil(context.deleted_epoch) || settings.options.includes('include-deleted')) {
        return _.get(context, spec);
      }
      return null;
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
          problem: `unknown key: ${value}`,
          query: extractorObj
        });
        return;
      }
      formular[key] = context => {
        if (_.isNil(context.deleted_epoch) || settings.options.includes('include-deleted')) {
          return _.get(context, value);
        }
        return null;
      };
      return;
    }
    if (typeof value !== 'object' || Object.prototype.toString.call(value) === '[object Array]') {
      errors.push({
        problem: 'right-hand side of complex extractor must be a string or a subquery',
        query: value
      });
      return;
    }
    const subquery = builder(value, settings);
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
      const extract = _.fromPairs(_.zip(keys, extractors));
      if (!_.isNil(context.deleted_epoch)) {
        extract.deleted_epoch = context.deleted_epoch;
        extract.deleted_by = context.deleted_by;
      }
      return extract;
    });
  });
}

function buildWhereClause(criteria, keys, timeKeys, settings) {
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
      const pointInTimeEpoch = settings.epochNow - (daysAgo * 3600 * 24);
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
        problem: `unknown key: ${key}`,
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
        return mod(context, querying).where(key, valueOfRef);
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
        return mod(context, querying).whereRaw(
          `${path[0]} @> '{"${path[1]}": ${JSON.stringify(value)}}'::jsonb`
        );
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

function modifyQueryAccordingToOptions(options, querying) {
  if (!options.includes('include-deleted')) {
    querying = querying.andWhere('deleted_epoch', null);
  }
  return querying;
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

module.exports = exports = (request, settings) => {
  return builder(request, settings);
};
