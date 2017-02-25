'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/v1/current-db')(knex);
const seedBigDb = require('server/seeds/integration-test-big').seed;
const expectSuccess = require('server/integration-verifiers').expectSuccess;
const expectFailure = require('server/integration-verifiers').expectFailure;
const expectValidate = require('server/integration-verifiers').expectValidate;

/* eslint-disable no-unused-expressions */
describe('API v1 community endpoints', () => {
  const service = request(server);
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
      service.get(url)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expectSuccess(res.body, (links, list) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expect(list.length).to.equal(2);
          list.forEach(data => {
            expectValidate(data, 'v1/schemas/community-out.json');
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
    it('should return Not Found on unknown name', done => {
      service.get('/v1/community/Osten Feldt')
      .expect(404)
      .end(done);
    });
    it('should locate community by name', done => {
      service.get('/v1/community/Biblo')
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
          expect(data.attributes).to.not.be.null;
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
    it('should return Not Found on unknown community', done => {
      service.get('/v1/community/10')
      .expect(404)
      .end(done);
    });
  });
  describe('PUT /community/:id', () => {
    it('should return Not Found on any non-existing community', done => {
      service.put('/v1/community/10')
      .send({name: 'Name'})
      .expect(404)
      .end(done);
    });
  });
  describe('POST /community', () => {
    it('should reject missing data', done => {
      service.post('/v1/community')
      .send('')
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/field.*name.*is required/);
        });
      })
      .end(done);
    });
    it('should reject malformed data', done => {
      service.post('/v1/community')
      .send('My community')
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/JSON syntax error/);
        });
      })
      .end(done);
    });
    it('should reject JSON with excess fields', done => {
      service.post('/v1/community')
      .send({name: 'My community', ost: 'Extra field'})
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/has additional properties/);
        });
      })
      .end(done);
    });
    it('should add a new community with just a name', done => {
      const name = 'Sære Litterater';
      const id = 3;
      const location = `/v1/community/${id}`;
      service.post('/v1/community')
      .send({name})
      .expect('location', location)
      .expect(201)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(location);
          expectValidate(data, 'v1/schemas/community-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(id);
          expect(data).to.have.property('name');
          expect(data.name).to.equal(name);
          expect(data).to.have.property('attributes');
          expect(data.attributes).to.not.be.null;
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
      service.put(url)
      .send({name, attributes})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expectValidate(data, 'v1/schemas/community-out.json');
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
        service.get(url)
        .expect(200)
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(links).to.have.property('self');
            expect(links.self).to.equal(url);
            expectValidate(data, 'v1/schemas/community-out.json');
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
      })
      .catch(error => {
        done(error);
      });
    });
  });
});
