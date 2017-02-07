'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const schema = require('server/latest-schema')(knex);

/* eslint-disable no-unused-expressions */
describe('API v1 routes', () => {
  before(done => {
    schema.destroy()
    .then(() => {
      return schema.setup();
    })
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
        expect(res.body[0]).to.have.property('deleted_epoch');
        expect(res.body[0].deleted_epoch).to.be.null;
        expect(res.body[0]).to.have.property('created_epoch');
        expect(res.body[0].created_epoch).to.match(/^[0-9]+$/);
        expect(res.body[0]).to.have.property('modified_epoch');
        expect(res.body[0].modified_epoch).to.match(/^[0-9]+$/);
        expect(res.body[1]).to.have.property('name');
        expect(res.body[1].name).to.equal('LiteraturSiden');
      })
      .end(done);
    });
  });
});
