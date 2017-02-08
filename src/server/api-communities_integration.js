'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const schema = require('server/latest-schema')(knex);

/* eslint-disable no-unused-expressions */
describe('API v1 community endpoints', () => {
  before(done => {
    schema.destroy()
    .then(() => {
      return schema.setup();
    })
    .then(() => {
      done();
    });
  });
  beforeEach(done => {
    schema.clear()
    .then(() => {
      done();
    });
  });
  describe('GET /community', () => {
    it('should return no communities on empty database', done => {
      request(server)
      .get('/v1/community')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expect(res.body).to.be.json;
        expect(res.body.length).to.equal(0);
      })
      .end(done);
    });
  });
  describe('GET /community/:name', () => {
    it('should return Not Found on any community name', done => {
      request(server)
      .get('/v1/community/biblo')
      .expect(404)
      .end(done);
    });
  });
  describe('GET /community/:id', () => {
    it('should return Not Found on any community id', done => {
      request(server)
      .get('/v1/community/1')
      .expect(404)
      .end(done);
    });
  });
  describe('POST /community', () => {
    it('should reject malformed data', done => {
      request(server)
      .post('/v1/community')
      .send('My community')
      .expect(400)
      .end(done);
    });
    it('should add a new community');
  });
});
