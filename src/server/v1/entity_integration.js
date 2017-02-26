'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/v1/current-db')(knex);
const seedBigDb = require('server/seeds/integration-test-big').seed;
// const expectSuccess = require('server/integration-verifiers').expectSuccess;
const expectFailure = require('server/integration-verifiers').expectFailure;
// const expectValidate = require('server/integration-verifiers').expectValidate;

/* eslint-disable no-unused-expressions */
describe('API v1 entity endpoints', () => {
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

  describe('GET /community/:id/entity', () => {

    it('should return seeded entities');

    it('should return Not Found for non-existent community', done => {
      service.get('/v1/community/99/entity')
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Community does not exist/);
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });
  });

  describe('POST /community/:id/entity', () => {

    it('should return Not Found for non-existent community', done => {
      service.post('/v1/community/99/entity')
      .send({
        owner_id: 3,
        type: 'campaign',
        title: 'Byg en sæbekassevogn',
        contents: 'Bla bla bla'
      })
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Community does not exist/);
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return Not Found for non-existent owner', done => {
      service.post('/v1/community/1/entity')
      .send({
        owner_id: 95,
        type: 'campaign',
        title: 'Byg en sæbekassevogn',
        contents: 'Bla bla bla'
      })
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Profile does not exist/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Profile 95 does not exist/);
          expect(error.details).to.have.property('data');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should reject missing type', done => {
      service.post('/v1/community/1/entity')
      .send({
        title: 'Byg en sæbekassevogn',
        contents: 'Bla bla bla'
      })
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/field.*type.*is required/);
        });
      })
      .end(done);
    });

    it('should reject missing title', done => {
      service.post('/v1/community/1/entity')
      .send({
        type: 'campaign',
        contents: 'Bla bla bla'
      })
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/field.*title.*is required/);
        });
      })
      .end(done);
    });

    it('should reject missing contents', done => {
      service.post('/v1/community/1/entity')
      .send({
        type: 'campaign',
        title: 'Byg en sæbekassevogn'
      })
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/field.*contents.*is required/);
        });
      })
      .end(done);
    });

    it('should reject missing owner', done => {
      service.post('/v1/community/1/entity')
      .send({
        type: 'campaign',
        title: 'Byg en sæbekassevogn',
        contents: 'Bla bla bla'
      })
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/field.*owner_id.*is required/);
        });
      })
      .end(done);
    });

    it('should reject owner in other community', done => {
      service.post('/v1/community/1/entity')
      .send({
        owner_id: 5,
        type: 'campaign',
        title: 'Byg en sæbekassevogn',
        contents: 'Bla bla bla'
      })
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Profile does not belong to community/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Profile 5 does not belong to community 1/);
          expect(error.details).to.have.property('data');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should reject malformed data', done => {
      service.post('/v1/community/1/entity')
      .send('ost')
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
      service.post('/v1/community/1/entity')
      .send({
        type: 'campaign',
        title: 'Byg en sæbekassevogn',
        contents: 'Bla bla bla',
        owner_id: 1,
        piggyback: 'I just wanna be in'
      })
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

    it('should add a new entity with type, title & contents');

    it('should add a new entity with entity_ref');
  });

  describe('GET /community/:id/entity/:id', () => {

    it('should return Not Found on unknown entity');

    it('should return Not Found when entity does not belong to community');
  });

  describe('PUT /community/:id/entity/:id', () => {

    it('should return Not Found when entity does not belong to community');

    it('should return Not Found on any non-existing entity');

    it('should return Bad Request on any non-existing profile for modifier');

    it('should mark as deleted when modified_by is only field');

    it('should update log with minimal attributes');

    it('should update existing entity with type');

    it('should update existing entity with title');

    it('should update existing entity with contents');

    it('should update existing entity with start_epoch');

    it('should update existing entity with end_epoch');

    it('should update existing entity with type, title, contents');
  });

  describe('GET /community/:id/entity/:id/attribute/:key', () => {

    it('should return Not Found for non-existent community');

    it('should return Not Found on any non-existing entity');

    it('should return Not Found for non-existent key');

    it('should retrieve a value by key');
  });

  describe('GET /community/:id/entity/:id/attribute', () => {

    it('should return Not Found when entity does not belong to community');

    it('should return Not Found on any non-existing entity');

    it('should retrieve all attributes');

    it('should retrieve empty set of attributes');
  });

  describe('POST /community/:id/entity/:id/attribute', () => {

    it('should return Not Found when entity does not belong to community');

    it('should return Not Found on any non-existing entity');

    it('should return Conflict on an existing key');

    it('should add a new key-value pair');
  });
});
