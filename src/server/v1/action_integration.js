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
describe('API v1 action endpoints', () => {
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

  describe('GET /community/:id/action', () => {

    it('should return seeded actions', done => {
      const url = '/v1/community/1/action';
      service.get(url)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expectSuccess(res.body, (links, list) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expect(list.length).to.equal(0);
          list.forEach(data => {
            expectValidate(data, 'v1/schemas/action-out.json');
            expect(data).to.have.property('id');
            expect(data).to.have.property('type');
            expect(data).to.have.property('attributes');
            expect(data).to.have.property('start_epoch');
            expect(data.start_epoch).to.be.null;
            expect(data).to.have.property('end_epoch');
            expect(data.end_epoch).to.be.null;
            expect(data).to.have.property('created_epoch');
            expect(data.created_epoch).to.match(/^[0-9]+$/);
            expect(data).to.have.property('modified_epoch');
            expect(data.modified_epoch).to.be.null;
            expect(data).to.have.property('modified_by');
            expect(data.modified_by).to.be.null;
            expect(data).to.have.property('deleted_epoch');
            expect(data.deleted_epoch).to.be.null;
            expect(data).to.have.property('deleted_by');
            expect(data.deleted_by).to.be.null;
            expect(data).to.have.property('community_id');
            expect(data.community_id).to.match(/^[0-9]+$/);
            expect(data).to.have.property('log');
            expect(data.log).to.be.null;
          });
        });
      })
      .end(done);
    });

    it('should return Not Found for non-existent community', done => {
      service.get('/v1/community/84/action')
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

  describe('POST /community/:id/action', () => {

    it('should return Not Found for non-existent community', done => {
      service.post('/v1/community/83/action')
      .send({type: 'like', owner_id: 1})
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

    it('should reject missing data', done => {
      service.post('/v1/community/1/action')
      .send({})
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/field.*type.*is required/);
          expect(error).to.match(/field.*owner_id.*is required/);
        });
      })
      .end(done);
    });

    it('should reject malformed data', done => {
      service.post('/v1/community/1/action')
      .send('My Action')
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
      service.post('/v1/community/1/action')
      .send({piggyback: 'I just wanna be in'})
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

    it('should add a new action with a type and owner', done => {
      const type = 'need-help';
      const id = 1;
      const location = `/v1/community/1/action/${id}`;
      service.post('/v1/community/1/action')
      .send({type, owner_id: 2})
      .expect(201)
      .expect('location', location)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(location);
          expectValidate(data, 'v1/schemas/action-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(id);
          expect(data).to.have.property('type');
          expect(data.type).to.equal(type);
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

  describe('GET /community/:id/action/:id', () => {
  });

  describe('PUT /community/:id/action/:id', () => {
  });

});
