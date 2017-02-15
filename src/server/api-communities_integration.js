'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/current-db')(knex);
const seedBigDb = require('server/seeds/integration-test-big').seed;
const validator = require('is-my-json-valid/require');

const logger = require('__/logging')(config.logger);

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
      return seedBigDb(knex);
    })
    .then(() => {
      done();
    });
  });
  describe('GET /community', () => {
    it('should return seeded communities', done => {
      const url = '/v1/community';
      request(server)
      .get(url)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expectSuccess(res.body, (links, list) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expect(list.length).to.equal(2);
          list.forEach(data => {
            expectValidate(data, 'schemas/community-out.json');
            expect(data).to.have.property('id');
            expect(data).to.have.property('name');
            expect(data).to.have.property('attributes');
            expect(data).to.have.property('created_epoch');
            expect(data.created_epoch).to.match(/^[0-9]+$/);
            expect(data).to.have.property('modified_epoch');
            expect(data.modified_epoch).to.be.null;
            expect(data).to.have.property('deleted_epoch');
            expect(data.deleted_epoch).to.be.null;
          });
          expect(list[0].name).to.equal('Biblo');
          expect(list[1].name).to.equal('LitteraturSiden');
          expect(list[1].attributes).to.deep.equal({production: false});
        });
      })
      .end(done);
    });
  });
  describe('GET /community/:name', () => {
    it('should return Not Found on any community name', done => {
      request(server)
      .get('/v1/community/Biblo')
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal('/v1/community/1');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(1);
          expect(data).to.have.property('name');
          expect(data.name).to.equal('Biblo');
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
  describe('GET /community/:id', () => {
    it('should return Not Found on any community id', done => {
      request(server)
      .get('/v1/community/10')
      .expect(404)
      .end(done);
    });
  });
  describe('PUT /community/:id', () => {
    it('should return Not Found on any non-existing community', done => {
      request(server)
      .put('/v1/community/3')
      .send({name: 'Name'})
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
      const id = 3;
      request(server)
      .post('/v1/community')
      .send({name})
      .expect('location', `/v1/community/${id}`)
      .expect(201)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(`/v1/community/${id}`);
          expectValidate(data, 'schemas/community-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(id);
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
  describe('PUT /community/:id', () => {
    const name = 'Søde Litterater';
    const attributes = {test: true};
    const id = 2;
    const url = `/v1/community/${id}`;
    it('should update existing community and retrieve the update', done => {
      const service = request(server);
      service
      .put(url)
      .send({name, attributes})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expectValidate(data, 'schemas/community-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(id);
          expect(data).to.have.property('name');
          expect(data.name).to.equal(name);
          expect(data).to.have.property('attributes');
          expect(data.attributes).to.deep.equal(attributes);
          expect(data).to.have.property('created_epoch');
          expect(data.created_epoch).to.match(/^[0-9]+$/);
          expect(data).to.have.property('modified_epoch');
          expect(data.modified_epoch).to.match(/^[0-9]+$/);
          expect(data.modified_epoch).to.not.be.below(data.created_epoch);
          expect(data).to.have.property('deleted_epoch');
          expect(data.deleted_epoch).to.be.null;
        });
      })
      .then(() => {
        service
        .get(url)
        .expect(200)
        .expect(res => {
          // logger.log.debug(res);
          expectSuccess(res.body, (links, data) => {
            expect(links).to.have.property('self');
            expect(links.self).to.equal(url);
            expectValidate(data, 'schemas/community-out.json');
            expect(data).to.have.property('id');
            expect(data.id).to.equal(id);
            expect(data).to.have.property('name');
            expect(data.name).to.equal(name);
            expect(data).to.have.property('attributes');
            expect(data.attributes).to.deep.equal(attributes);
            expect(data).to.have.property('created_epoch');
            expect(data.created_epoch).to.match(/^[0-9]+$/);
            expect(data).to.have.property('modified_epoch');
            expect(data.modified_epoch).to.match(/^[0-9]+$/);
            expect(data.modified_epoch).to.not.be.below(data.created_epoch);
            expect(data).to.have.property('deleted_epoch');
            expect(data.deleted_epoch).to.be.null;
          });
        })
        .end(done);
      });
    });
  });
});

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

function expectValidate(document, schema) {
  const validate = validator(schema);
  validate(document);
  const errors = JSON.stringify(validate.errors);
  expect(errors).to.equal('null');
}
