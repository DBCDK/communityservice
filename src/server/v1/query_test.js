'use strict';

const validate = require('./query-validator');
const expect = require('chai').expect;

/* eslint-disable no-unused-expressions */
describe('API v1 query validation', () => {

  function expectSuccess() {
    const errors = JSON.stringify(validate.errors);
    expect(errors).to.equal('null');
  }

  function expectFailure(pattern) {
    const errors = JSON.stringify(validate.errors);
    expect(errors).to.match(pattern);
  }

  describe('selector', () => {

    it('should reject no selector', () => {
      const res = validate({});
      expectFailure(/should have exactly one of: Singleton, List, Count/);
      expect(res).to.be.false;
    });

    it('should reject unknown selector', () => {
      const res = validate({Grap: 'something'});
      expectFailure(/should have exactly one of: Singleton, List, Count/);
      expect(res).to.be.false;
    });

    it('should reject more than one selector', () => {
      const res = validate({Count: {}, Singleton: {}});
      expectFailure(/should have exactly one of: Singleton, List, Count/);
      expect(res).to.be.false;
    });

    describe('Count', () => {

      it('should reject additional properties', () => {
        const res = validate({Count: {}, Include: {}});
        expectFailure(/unexpected properties: Include/);
        expect(res).to.be.false;
      });

      it('should accept Count selector', () => {
        const res = validate({Count: {}});
        expectSuccess();
        expect(res).to.be.true;
      });

    });

    describe('Singleton', () => {

      it('should reject missing extractor property', () => {
        const res = validate({Singleton: {}});
        expectFailure(/should have exactly one of: Include, Case/);
        expect(res).to.be.false;
      });

      it('should accept Singleton selector', () => {
        const res = validate({Singleton: {}, Include: {}});
        expectSuccess();
        expect(res).to.be.true;
      });
    });

    describe('List', () => {

      it('should reject missing extractor property', () => {
        const res = validate({List: {}});
        expectFailure(/should have exactly one of: Include, Case/);
        expect(res).to.be.false;
      });

      it('should reject missing limit property', () => {
        const res = validate({List: {}, Include: {}});
        expectFailure(/should have a Limit/);
        expect(res).to.be.false;
      });

      it('should accept List selector', () => {
        const res = validate({List: {}, Limit: 5, Include: {}});
        expectSuccess();
        expect(res).to.be.true;
      });
    });

  });
});
