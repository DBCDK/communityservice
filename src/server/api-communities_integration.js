'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/current-db')(knex);
const validator = require('is-my-json-valid/require');

// const logger = require('__/logging')(config.logger);

function expectSuccess(document, next) {
  const validate = validator('schemas/success-out.json');
  validate(document);
  const errors = JSON.stringify(validate.errors);
  expect(errors).to.equal('null');
  expect(document).to.have.property('links');
  const links = document.links;
  expect(document).to.have.property('data');
  const data = document.data;
  next(links, data);
}

function expectValidate(document, schema) {
  const validate = validator(schema);
  validate(document);
  const errors = JSON.stringify(validate.errors);
  expect(errors).to.equal('null');
}

/* eslint-disable no-unused-expressions */
describe('API v1 community endpoints', () => {
  before(done => {
    db.destroy()
    .then(db.setup)
    .then(() => {
      done();
    });
  });
  beforeEach(done => {
    db.clear()
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
    it('should reject missing data', done => {
      request(server)
      .post('/v1/community')
      .send('')
      .expect(400)
      .end(done);
    });
    it('should reject malformed data', done => {
      request(server)
      .post('/v1/community')
      .send('My community')
      .expect(400)
      .end(done);
    });
    it('should reject non-conformant JSON', done => {
      request(server)
      .post('/v1/community')
      .send('{"ost": "My community"}')
      .expect(400)
      .end(done);
    });
    it('should add a new community with just a name', done => {
      const name = 'Sære Litterater';
      request(server)
      .post('/v1/community')
      .send({name})
      .expect('location', '/v1/community/1')
      .expect(201)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal('/v1/community/1');
          expectValidate(data, 'schemas/community-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(1);
          expect(data).to.have.property('name');
          expect(data.name).to.equal(name);
          expect(data).to.have.property('attributes');
          expect(data.attributes).to.be.null;
          expect(data).to.have.property('created_epoch');
          expect(data.created_epoch).to.match(/^[0-9]+$/);
          expect(data).to.have.property('modified_epoch');
          expect(data.modified_epoch).to.be.null;
          expect(data).to.have.property('deleted_epoch');
          expect(data.deleted_epoch).to.be.null;
        });
      })
      .end(done);
    });
  });
});
