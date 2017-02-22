'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/current-db')(knex);
const seedBigDb = require('server/seeds/integration-test-big').seed;
const expectSuccess = require('./integration-validators').expectSuccess;
const expectFailure = require('./integration-validators').expectFailure;
const expectValidate = require('./integration-validators').expectValidate;

/* eslint-disable no-unused-expressions */
describe('API v1 profile endpoints', () => {
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
  describe('GET /community/:id/profile', () => {
    it('should return seeded profiles', done => {
      const url = '/v1/community/1/profile';
      service.get(url)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expectSuccess(res.body, (links, list) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expect(list.length).to.equal(3);
          list.forEach(data => {
            expectValidate(data, 'schemas/profile-out.json');
            expect(data).to.have.property('id');
            expect(data).to.have.property('name');
            expect(data).to.have.property('attributes');
            expect(data.attributes).to.have.property('description');
            expect(data.attributes).to.have.property('email');
            expect(data.attributes).to.have.property('libraryId');
            expect(data).to.have.property('log');
            expect(data).to.have.property('created_epoch');
            expect(data.created_epoch).to.match(/^[0-9]+$/);
            expect(data).to.have.property('modified_epoch');
            expect(data.modified_epoch).to.be.null;
            expect(data).to.have.property('deleted_epoch');
            expect(data.deleted_epoch).to.be.null;
          });
          expect(list[0].name).to.equal('Pink ');
          expect(list[0].attributes.description).to.deep.equal(
            'Jeg er en pige på 11 år og jeg elsker at høre musik og at være sammen med mine venner.'
          );
          expect(list[0].attributes.email).to.deep.equal('pink@gmail.com');
          expect(list[0].attributes.libraryId).to.deep.equal(654321);
          expect(list[1].name).to.equal('Kaptajn underhyler');
          expect(list[1].attributes.description).to.deep.equal('Jeg er superhelt\nuden bukser på.');
          expect(list[1].attributes.email).to.deep.equal('under_hyler@ebrev.dk');
          expect(list[1].attributes.libraryId).to.deep.equal(648485);
        });
      })
      .end(done);
    });
  });
  describe('POST /community/:id/profile', () => {
    it('should reject missing data', done => {
      service.post('/v1/community/1/profile')
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
      service.post('/v1/community/1/profile')
      .send('My profile')
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
    it('should reject non-conformant JSON', done => {
      service.post('/v1/community/1/profile')
      .send({name: 'My profile', piggyback: 'I just wanna be in'})
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
    it('should add a new profile with just a name', done => {
      const name = 'Miss Mia';
      const id = 4;
      const location = `/v1/community/1/profile/${id}`;
      service.post('/v1/community/1/profile')
      .send({name})
      .expect('location', location)
      .expect(201)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(location);
          expectValidate(data, 'schemas/profile-out.json');
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
  describe('GET /community/:id/profile/:id', () => {
    it('should return Not Found on unknown profile', done => {
      service.get('/v1/community/1/profile/100')
      .expect(404)
      .end(done);
    });
    it('should return Not Found when profile does not belong to community');
  });
  describe('PUT /community/:id/profile/:id', () => {
    it('should return Not Found when profile does not belong to community');
    it('should return Not Found on any non-existing profile', done => {
      service.put('/v1/community/1/profile/100')
      .send({name: 'Name', modified_by: 1})
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/does not exist/);
        });
      })
      .end(done);
    });
    it('should mark as deleted when modified_by in only field');
  });
  describe('PUT /community/:id/profile/:id', () => {
    const name = 'Snurre Snup';
    const attributes = {test: true, interests: ['carrots', 'rabbit holes']};
    const id = 3;
    const url = `/v1/community/1/profile/${id}`;
    it('should update existing profile and retrieve the update');
  });
});