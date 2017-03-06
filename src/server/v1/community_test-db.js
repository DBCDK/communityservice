'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/v1/current-db')(knex);
const seedSmallDb = require('server/seeds/small').seed;
const expectSuccess = require('server/test-verifiers').expectSuccess;
const expectFailure = require('server/test-verifiers').expectFailure;
const expectValidate = require('server/test-verifiers').expectValidate;

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
      return seedSmallDb(knex);
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
      const url = '/v1/community/Osten Feldt';
      service.get(url)
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error.title).to.equal('Community does not exist');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
          expect(error.meta.resource).to.equal(url);
        });
      })
      .end(done);
    });

    // TODO: test with spaces and non-ascii characters.
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
          expect(data).to.have.property('deleted_epoch');
          expect(data.deleted_epoch).to.be.null;
        });
      })
      .end(done);
    });
  });

  describe('GET /community/:id', () => {

    it('should return Not Found on unknown community', done => {
      const url = '/v1/community/10';
      service.get(url)
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error.title).to.equal('Community does not exist');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
          expect(error.meta.resource).to.equal(url);
        });
      })
      .end(done);
    });
  });

  describe('PUT /community/:id', () => {

    it('should return Not Found on any non-existing community', done => {
      const url = '/v1/community/10';
      service.put(url)
      .send({name: 'Name'})
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error.title).to.equal('Community does not exist');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
          expect(error.meta.resource).to.equal(url);
        });
      })
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
          expect(data.attributes).to.be.empty;
          expect(data).to.have.property('created_epoch');
          expect(data.created_epoch).to.match(/^[0-9]+$/);
          expect(data).to.have.property('deleted_epoch');
          expect(data.deleted_epoch).to.be.null;
        });
      })
      .end(done);
    });
  });

  describe('PUT /community/:id', () => {

    const name = 'Søde Litterater';
    const newAttributes = {test: true};
    const oldAttributes = {production: false};
    const totalAttributes = Object.assign({}, oldAttributes, newAttributes);
    const id = 2;
    const url = `/v1/community/${id}`;

    it('should update existing community and retrieve the update', done => {
      service.put(url)
      .send({name, attributes: newAttributes})
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
          expect(data.attributes).to.deep.equal(totalAttributes);
          expect(data).to.have.property('created_epoch');
          expect(data.created_epoch).to.match(/^[0-9]+$/);
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
            expect(data.attributes).to.deep.equal(totalAttributes);
            expect(data).to.have.property('created_epoch');
            expect(data.created_epoch).to.match(/^[0-9]+$/);
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
