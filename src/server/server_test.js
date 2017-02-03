'use strict';

const expect = require('chai').expect;
const request = require('supertest');

const app = require('server');
const port = 6666;
const url = `http://localhost:${port}`;
let server;

describe('service API v1', () => {
  before(() => {
    server = app.listen(port, () => {
      console.log(`      [Server started on port ${server.address().port}]`); // eslint-disable-line no-console
    });
  });
  describe('status', () => {
    it('should return a JSON structure with version and address', done => {
      request(url)
      .get('/v1/status')
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
      request(url)
      .get('/v1/pid')
      .set('Accept', 'text/plain')
      .expect(200)
      .expect('Content-Type', /text/)
      .expect(/^[0-9]+$/)
      .end(done);
    });
  });
  describe('default handler should return error', () => {
    it('as text', done => {
      const endpoint = '/v2/status';
      request(url)
      .get(endpoint)
      .set('Accept', 'text/plain')
      .expect(404)
      .expect(/unknown endpoint/)
      .expect(new RegExp(endpoint))
      .end(done);
    });
    it('as JSON', done => {
      const endpoint = '/doesNotExist';
      request(url)
      .get(endpoint)
      .set('Accept', 'application/json')
      .expect(404)
      .expect(res => {
        expect(res.body).to.have.property('error');
        expect(res.body.error).to.equal('unknown endpoint');
        expect(res.body).to.have.property('resource');
        expect(res.body.resource).to.equal(endpoint);
      })
      .end(done);
    });
  });
  after(() => {
    server.close();
    console.log('      [Server closed]'); // eslint-disable-line no-console
  });
});
