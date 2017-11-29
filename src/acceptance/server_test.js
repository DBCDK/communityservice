/* eslint-disable no-unused-expressions */
'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const {expectFailure, expectValidate} = require('./output-verifiers');
const app = require('server');

describe('service meta API', () => {

  describe('/howru', () => {
    it('should return a JSON structure with version and address', () => {
      // Arrange.
      // Act.
      return request(app)
      .get('/howru')
      .set('Accept', 'application/json')
      // Assert.
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(res => {
        expectValidate(res.body, 'schemas/status-out.json');
        // Remote connections status.
        expect(res.body.ok).to.be.true;
        expect(res.body).to.not.have.property('errorText');
        expect(res.body).to.not.have.property('errorLog');
        // Service info.
        expect(res.body).to.have.property('address');
        expect(res.body['api-version']).to.equal('1');
        expect(res.body.version).to.equal('1.0.0');
        expect(res.body).to.not.have.nested.property('config.db.connection.user');
        expect(res.body).to.not.have.nested.property('config.db.connection.password');
        // Safety net, do not leak something that looks like a secret.
        const everything = JSON.stringify(res.body);
        expect(everything).to.not.match(/password/i);
        expect(everything).to.not.match(/secret/i);
      });
    });
  });

  describe('/pid', () => {
    it('should return the process id', () => {
      return request(app)
      .get('/pid')
      .set('Accept', 'text/plain')
      .expect(200)
      .expect('Content-Type', /text/)
      .expect(/^[0-9]+$/);
    });
  });

  describe('default handler should return error', () => {
    it('as JSON', () => {
      const endpoint = '/doesNotExist';
      return request(app)
      .get(endpoint)
      .set('Accept', 'application/json')
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.equal('Unknown endpoint');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
          expect(error.meta.resource).to.equal(endpoint);
        });
      });
    });
  });

  describe('server crashes', () => {
    it('should be catched', () => {
      return request(app)
      .get('/crash')
      .expect(500);
    });
  });
});
