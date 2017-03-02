'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/v1/current-db')(knex);
const seedSmallDb = require('server/seeds/integration-small').seed;
const expectSuccess = require('server/integration-verifiers').expectSuccess;
const expectFailure = require('server/integration-verifiers').expectFailure;
const expectValidate = require('server/integration-verifiers').expectValidate;

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
      return seedSmallDb(knex);
    })
    .then(() => {
      done();
    });
  });

  describe('GET /community/:id/entity', () => {

    it('should return seeded entities', done => {
      const url = '/v1/community/1/entity';
      service.get(url)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expectSuccess(res.body, (links, list) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expect(list.length).to.equal(1);
          list.forEach(data => {
            expectValidate(data, 'v1/schemas/entity-out.json');
            expect(data).to.have.property('id');
            expect(data).to.have.property('title');
            expect(data).to.have.property('type');
            expect(data).to.have.property('contents');
            expect(data).to.have.property('contents');
            expect(data).to.have.property('start_epoch');
            expect(data.start_epoch).to.be.null;
            expect(data).to.have.property('end_epoch');
            expect(data.end_epoch).to.be.null;
            expect(data).to.have.property('attributes');
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
            expect(data).to.have.property('owner_id');
            expect(data.owner_id).to.match(/^[0-9]+$/);
            expect(data).to.have.property('log');
            expect(data.log).to.be.null;
          });
        });
      })
      .end(done);
    });

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

    const url = '/v1/community/1/entity';
    const title = 'Byg en sæbekassevogn';
    const type = 'campaign';
    const contents = 'Bla bla bla';
    const owner_id = 1;

    it('should return Not Found on non-existing entity_ref', done => {
      service.post(url)
      .send({type, title, contents, owner_id, entity_ref: 93})
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Entity does not exist/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Entity 93 does not exist/);
          expect(error.details).to.have.property('data');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should reject entity_ref belonging to other community', done => {
      service.post(url)
      .send({type, title, contents, owner_id, entity_ref: 2})
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Entity does not belong to community/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Entity 2 does not belong to community 1/);
          expect(error.details).to.have.property('data');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    const id = 3;
    const location = `${url}/${id}`;

    it('should add a new entity with type, title & contents', done => {
      service.post(url)
      .send({type, title, contents, owner_id})
      .expect(201)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(location);
          expectValidate(data, 'v1/schemas/entity-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(id);
          expect(data).to.have.property('title');
          expect(data.title).to.equal(title);
          expect(data).to.have.property('type');
          expect(data.type).to.equal(type);
          expect(data).to.have.property('contents');
          expect(data.contents).to.equal(contents);
          expect(data).to.have.property('attributes');
          expect(data.attributes).to.be.empty;
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
          expect(data).to.have.property('owner_id');
          expect(data.owner_id).to.match(/^[0-9]+$/);
          expect(data).to.have.property('entity_ref');
          expect(data.entity_ref).to.be.null;
          expect(data).to.have.property('log');
          expect(data.log).to.be.null;
        });
      })
      .end(done);
    });

    const parent = 1;

    it('should add a new entity with entity_ref', done => {
      service.post(url)
      .send({type, title, contents, owner_id, entity_ref: parent})
      .expect(201)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(location);
          expectValidate(data, 'v1/schemas/entity-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(id);
          expect(data).to.have.property('title');
          expect(data.title).to.equal(title);
          expect(data).to.have.property('type');
          expect(data.type).to.equal(type);
          expect(data).to.have.property('contents');
          expect(data.contents).to.equal(contents);
          expect(data).to.have.property('attributes');
          expect(data.attributes).to.be.empty;
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
          expect(data).to.have.property('owner_id');
          expect(data.owner_id).to.match(/^[0-9]+$/);
          expect(data).to.have.property('entity_ref');
          expect(data.entity_ref).to.equal(parent);
          expect(data).to.have.property('log');
          expect(data.log).to.be.null;
        });
      })
      .end(done);
    });

    it('should add a new entity with start_epoch', done => {
      service.post(url)
      .send({type, title, contents, owner_id, start_epoch: 1488318318})
      .expect(201)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(location);
          expectValidate(data, 'v1/schemas/entity-out.json');
          expect(data).to.have.property('start_epoch');
          expect(data.start_epoch).to.equal(1488318318);
        });
      })
      .end(done);
    });

    it('should add a new entity with end_epoch', done => {
      service.post(url)
      .send({type, title, contents, owner_id, end_epoch: 1488318319})
      .expect(201)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(location);
          expectValidate(data, 'v1/schemas/entity-out.json');
          expect(data).to.have.property('end_epoch');
          expect(data.end_epoch).to.equal(1488318319);
        });
      })
      .end(done);
    });

  });

  describe('GET /community/:id/entity/:id', () => {

    it('should return Not Found on unknown entity', done => {
      service.get('/v1/community/1/entity/91')
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Entity does not exist/);
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return Not Found for non-existent community', done => {
      service.get('/v1/community/90/entity/1')
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

    it('should return Not Found when entity does not belong to community', done => {
      service.get('/v1/community/2/entity/1')
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Entity does not belong to community/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Entity 1 does not belong to community 2/);
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return specific entity');
  });

  describe('PUT /community/:id/entity/:id', () => {

    it('should reject non-conformant JSON', done => {
      service.put('/v1/community/1/entity/1')
      .send({})
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Input data does not adhere to schema/);
        });
      })
      .end(done);
    });

    it('should return Not Found when entity does not belong to community', done => {
      service.put('/v1/community/89/entity/1')
      .send({title: 'Title', modified_by: 1})
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Community does not exist/);
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return Not Found on any non-existing entity', done => {
      service.put('/v1/community/1/entity/88')
      .send({title: 'Title', modified_by: 1})
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

    it('should return Not Found on any non-existing profile for modifier', done => {
      service.put('/v1/community/1/entity/1')
      .send({title: 'Title', modified_by: 87})
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

    it('should return Bad Request on modifier profile belonging to another community', done => {
      service.put('/v1/community/1/entity/1')
      .send({title: 'Title', modified_by: 5})
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

    const user_id = 5;
    const url = '/v1/community/2/entity/2';

    it('should mark as deleted when modified_by is only field', done => {
      service.put(url)
      .send({modified_by: user_id})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expectValidate(data, 'v1/schemas/entity-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(2);
          expect(data).to.have.property('title');
          expect(data.title).to.equal('Nøgen Frokost');
          expect(data).to.have.property('type');
          expect(data.type).to.equal('review');
          expect(data).to.have.property('contents');
          expect(data.contents).to.equal('En rigtig god bog, men jeg forstår den ikke helt...');
          expect(data).to.have.property('attributes');
          expect(data).to.have.property('created_epoch');
          expect(data.created_epoch).to.match(/^[0-9]+$/);
          expect(data).to.have.property('modified_epoch');
          expect(data.modified_epoch).to.be.null;
          expect(data).to.have.property('modified_by');
          expect(data.modified_by).to.be.null;
          expect(data).to.have.property('deleted_epoch');
          expect(data.deleted_epoch).to.match(/^[0-9]+$/);
          expect(data).to.have.property('deleted_by');
          expect(data.deleted_by).to.equal(user_id);
          expect(data.deleted_epoch).to.not.be.below(data.created_epoch);
          expect(data).to.have.property('log');
          expect(data.log).to.be.null;
        });
      })
      .end(done);
    });

    it('should update log with no attributes when attributes not changed', done => {
      const url2 = '/v1/community/1/entity/1';
      // Get original entity.
      service.get(url2)
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          // Update entity
          service.put(url2)
          .send({title: 'Eventyr i Minecraft', attributes: data.attributes, modified_by: 2})
          .expect(200)
          .expect(res2 => {
            expectSuccess(res2.body, (links2, data2) => {
              expect(data2.log).to.have.length(1);
              const log = data2.log[0];
              expect(log).to.have.property('title');
              expect(log).to.not.have.property('type');
              expect(log).to.not.have.property('contents');
              expect(log).to.not.have.property('attributes');
            });
          })
          .end(done);
        });
      })
      .catch(error => {
        done(error);
      });
    });

    it('should update existing entity with type', done => {
      service.put(url)
      .send({modified_by: user_id, type: 'blog'})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data.type).to.equal('blog');
        });
      })
      .end(done);
    });

    it('should update existing entity with title', done => {
      service.put(url)
      .send({modified_by: user_id, title: 'Ost'})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data.title).to.equal('Ost');
        });
      })
      .end(done);
    });

    it('should update existing entity with contents', done => {
      service.put(url)
      .send({modified_by: user_id, contents: 'Ost'})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data.contents).to.equal('Ost');
        });
      })
      .end(done);
    });

    it('should update existing entity with start_epoch', done => {
      service.put(url)
      .send({modified_by: user_id, start_epoch: 1488206262})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data.start_epoch).to.equal(1488206262);
          // A change chould be logged, but not the value.
          expect(data.log).to.have.length(1);
          expect(data.log[0]).to.not.have.property('start_epoch');
        });
      })
      .end(done);
    });

    it('should update existing start_epoch');

    it('should update existing entity with end_epoch', done => {
      service.put(url)
      .send({modified_by: user_id, end_epoch: 1488206262})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data.end_epoch).to.equal(1488206262);
          // A change chould be logged, but not the value.
          expect(data.log).to.have.length(1);
          expect(data.log[0]).to.not.have.property('end_epoch');
        });
      })
      .end(done);
    });

    it('should update existing end_epoch');

    it('should update existing entity with type, title, contents', done => {
      service.put(url)
      .send({
        modified_by: user_id,
        type: 'blog',
        title: 'Title',
        contents: 'En masse ting'
      })
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data.type).to.equal('blog');
          expect(data.title).to.equal('Title');
          expect(data.contents).to.equal('En masse ting');
        });
      })
      .end(done);
    });

    it('should add attributes to existing entity', done => {
      service.put('/v1/community/1/entity/1')
      .send({
        modified_by: 1,
        attributes: {
          small: 'https://placehold.it/350x150',
          large: null,
          what: {ping: 'pong'},
          numbers: [1, 2]
        }
      })
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data.attributes).to.deep.equal({
            small: 'https://placehold.it/350x150',
            medium: 'http://biblo-admin.demo.dbc.dk/sites/default/files/styles/medium/public/campaigns/logos/img/ikon%20gruppe.png?itok=87DbwOLX',
            svg: 'http://biblo-admin.demo.dbc.dk/sites/default/files/campaigns/logos/svg/ikon%20gruppe.png',
            what: {ping: 'pong'},
            numbers: [1, 2]
          });
        });
      })
      .end(done);
    });
  });

});
