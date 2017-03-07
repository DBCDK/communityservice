'use strict';

const expect = require('chai').expect;
const validator = require('is-my-json-valid/require');

/* eslint-disable no-unused-expressions */

describe('Schema for queries', () => {

  const validate = validator('query-get.json', {verbose: true});

  function expectSuccess() {
    const errors = JSON.stringify(validate.errors);
    expect(errors).to.equal('null');
  }

  function expectFailure() {
    const errors = JSON.stringify(validate.errors);
    expect(errors).to.match(/no.* schemas match/);
  }

  it('should reject empty query', () => {
    validate({});
    expectFailure();
  });

  it('should reject query with unknown selector', () => {
    validate({Select: {Profile: 1}});
    expectFailure();
  });

  describe('with Count', () => {

    it('should accept Count operator', () => {
      validate({Count: {Action: {type: 'like', entity_ref: 3217}}});
      expectSuccess();
    });

    it('should reject query with extracor', () => {
      validate({Count: {Action: {type: 'like'}}, Include: 'id'});
      expectFailure();
    });

    it('should reject query with limitor', () => {
      validate({Count: {Action: {type: 'like'}}, Offset: 2});
      expectFailure();
    });
  });

  describe('with Singleton', () => {

    it('should reject query with only selector', () => {
      validate({Singleton: {Profile: 1}});
      expectFailure();
    });

    it('should reject query with unknown extractor', () => {
      validate({Singleton: {Profile: 1}, Traverse: true});
      expectFailure();
    });

    it('should accept unconditional extractor', () => {
      validate({Singleton: {Profile: 1}, Include: 'id'});
      expectSuccess();
    });

    it('should accept conditional extractor', () => {
      validate({Singleton: {Profile: 1}, Case: [{type: 'profile', Include: 'id'}]});
      expectSuccess();
    });

    it('should reject query with several extractors', () => {
      validate({Singleton: {Profile: 1}, Include: 'id', Case: {}});
      expectFailure();
    });

    it('should reject query with limitor', () => {
      validate({Singleton: {Profile: 1}, Limit: 2, Include: 'id'});
      expectFailure();
    });
  });

  describe('with List', () => {

    it('should reject query with only selector', () => {
      validate({List: {Entity: {type: 'post'}}});
      expectFailure();
    });

    it('should reject query with unknown extractor', () => {
      validate({List: {Entity: {type: 'post'}}, Dive: true});
      expectFailure();
    });

    it('should reject query without limitor', () => {
      validate({List: {Entity: {type: 'post'}}, Include: 'id'});
      expectFailure();
    });

    it('should reject query with several extractors', () => {
      validate({List: {Entity: {type: 'post'}}, Limit: 8, Include: 'id', Case: {}});
      expectFailure();
    });

    it('should accept query with a single limitor', () => {
      validate({List: {Entity: {type: 'post'}}, Limit: 8, Include: 'id'});
      expectSuccess();
    });

    it('should accept query with all limitors', () => {
      validate({
        List: {Entity: {type: 'post'}},
        SortBy: 'modified',
        Order: 'ascending',
        Limit: 8,
        Offset: 10,
        Include: 'attributes.text'}
      );
      expectSuccess();
    });

    it('should reject query with all extra properties', () => {
      validate({
        List: {Entity: {type: 'post'}},
        SortBy: 'modified',
        Order: 'ascending',
        Limit: 8,
        Ost: 0,
        Include: 'attributes.text'}
      );
      expectFailure();
    });

  });

  describe('with extractor', () => {
    it('should accept simple dotted reference to context');
    it('should reject wrongly syntax for reference');
    it('should accept complex extraction');
    it('should accept consitional extraction');
  });

});

