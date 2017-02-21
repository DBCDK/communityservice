'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const expectFailure = require('./integration-validators').expectFailure;
const app = require('server');

describe('service meta API', () => {
  describe('status', () => {
    it('should return a JSON structure with version and address', done => {
      request(app)
      .get('/status')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect(res => {
        expect(res.body).to.have.property('address');
        expect(res.body).to.have.property('apiversion');
        expect(res.body.apiversion).to.equal('1');
        expect(res.body).to.have.property('siteversion');
        expect(res.body.siteversion).to.equal('0.1.0');
      })
      .end(done);
    });
  });
  describe('pid', () => {
    it('should return the process id', done => {
      request(app)
      .get('/pid')
      .set('Accept', 'text/plain')
      .expect(200)
      .expect('Content-Type', /text/)
      .expect(/^[0-9]+$/)
      .end(done);
    });
  });
  describe('default handler should return error', () => {
    it('as JSON', done => {
      const endpoint = '/doesNotExist';
      request(app)
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
      })
      .end(done);
    });
  });
  describe('server crashes', () => {
    it('should be catched', done => {
      request(app)
      .get('/crash')
      .expect(500)
      .end(done);
    });
  });
});
