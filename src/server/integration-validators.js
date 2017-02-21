/*
 * Common JSON validator functions for integration testing.
 */

'use strict';

const expect = require('chai').expect;
const validator = require('is-my-json-valid/require');

const config = require('server/config');
const logger = require('__/logging')(config.logger);

function expectSuccess(document, next) {
  // logger.log.debug(document);
  const validate = validator('schemas/success-out.json');
  validate(document);
  const errors = JSON.stringify(validate.errors);
  expect(errors).to.equal('null');
  expect(document).to.have.property('links');
  const links = document.links;
  expect(document).to.have.property('data');
  const data = document.data;
  // logger.log.debug(data);
  next(links, data);
}
exports.expectSuccess = expectSuccess;

function expectFailure(document, next) {
  // logger.log.debug(document);
  const validate = validator('schemas/failure-out.json');
  validate(document);
  const problems = JSON.stringify(validate.errors);
  expect(problems).to.equal('null');
  expect(document).to.have.property('errors');
  const errors = document.errors;
  expect(errors).to.be.an('array');
  next(errors);
}
exports.expectFailure = expectFailure;

function expectValidate(document, schema) {
  const validate = validator(schema);
  validate(document);
  const errors = JSON.stringify(validate.errors);
  expect(errors).to.equal('null');
}
exports.expectValidate = expectValidate;
