'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);

/* eslint-disable no-unused-expressions */
describe('API v1 routes', () => {
  before(done => {
    knex.migrate.latest()
    .then(() => {
      return knex.seed.run();
    })
    .then(() => {
      done();
    });
  });
  describe('GET /v1/service', () => {
    it('should return all services', done => {
      request(server)
      .get('/v1/service')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expect(res.body).to.be.json;
        expect(res.body.length).to.equal(2);
        expect(res.body[0]).to.have.property('name');
        expect(res.body[0].name).to.equal('Biblo');
        expect(res.body[1]).to.have.property('name');
        expect(res.body[1].name).to.equal('LiteraturSiden');
      })
      .end(done);
    });
  });
});
