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
          expect(list.length).to.equal(4);
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
          expect(list[0].type).to.equal('follow');
          expect(list[0].community_id).to.equal(1);
          expect(list[0].owner_id).to.equal(1);
          expect(list[0].profile_ref).to.equal(2);
          expect(list[0].attributes).to.be.empty;
          expect(list[1].type).to.equal('like');
          expect(list[1].community_id).to.equal(1);
          expect(list[1].owner_id).to.equal(2);
          expect(list[1].entity_ref).to.equal(2);
          expect(list[1].attributes).to.be.empty;
          expect(list[2].type).to.equal('participate');
          expect(list[2].community_id).to.equal(1);
          expect(list[2].owner_id).to.equal(4);
          expect(list[2].entity_ref).to.equal(1);
          expect(list[2].attributes).to.be.empty;
          expect(list[3].type).to.equal('flag');
          expect(list[3].community_id).to.equal(1);
          expect(list[3].owner_id).to.equal(2);
          expect(list[3].entity_ref).to.equal(2);
          expect(list[3].profile_ref).to.equal(3);
          expect(list[3].attributes).to.deep.equal({
            concern: 'Må man skrive "nøgen"?'
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

    it('should return Bad Request on non-existing entity_ref', done => {
      service.post('/v1/community/1/action')
      .send({owner_id: 1, type: 'like', entity_ref: 77})
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Entity does not exist/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Entity 77 does not exist/);
          expect(error.details).to.have.property('data');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return Bad Request on entity_ref belonging to another community', done => {
      service.post('/v1/community/1/action')
      .send({owner_id: 1, type: 'like', entity_ref: 2})
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

    it('should return Not Found on non-existing profile_ref', done => {
      service.post('/v1/community/1/action')
      .send({owner_id: 1, type: 'like', profile_ref: 78})
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Profile does not exist/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Profile 78 does not exist/);
          expect(error.details).to.have.property('data');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return Bad Request on profile_ref belonging to another community', done => {
      service.post('/v1/community/1/action')
      .send({owner_id: 1, type: 'like', profile_ref: 5})
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

    it('should add a new action with a type and owner', done => {
      const type = 'need-help';
      const id = 5;
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

    it('should return Not Found on unknown action', done => {
      service.get('/v1/community/1/action/82')
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Action does not exist/);
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return Not Found for non-existent community', done => {
      service.get('/v1/community/81/profile/1')
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

    it('should return Not Found when action does not belong to community', done => {
      service.get('/v1/community/2/action/1')
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Action does not belong to community/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Action 1 does not belong to community 2/);
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return specific action', done => {
      const url = '/v1/community/1/action/1';
      service.get(url)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expectValidate(data, 'v1/schemas/action-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(1);
          expect(data).to.have.property('owner_id');
          expect(data.owner_id).to.equal(1);
          expect(data).to.have.property('type');
          expect(data.type).to.equal('follow');
          expect(data).to.have.property('profile_ref');
          expect(data.profile_ref).to.equal(2);
          expect(data).to.have.property('attributes');
          expect(data.attributes).to.be.empty;
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
          expect(data.community_id).to.equal(1);
          expect(data).to.have.property('log');
          expect(data.log).to.be.null;
        });
      })
      .end(done);
    });

  });

  describe('PUT /community/:id/action/:id', () => {

    it('should reject non-conformant JSON', done => {
      service.put('/v1/community/1/action/1')
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

    it('should return Not Found when action does not belong to community', done => {
      service.put('/v1/community/81/action/1')
      .send({type: 'dislike', modified_by: 1})
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

    it('should return Not Found on any non-existing action', done => {
      service.put('/v1/community/1/action/80')
      .send({type: 'dislike', modified_by: 1})
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
      service.put('/v1/community/1/action/1')
      .send({type: 'dislike', modified_by: 79})
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
      .send({type: 'dislike', modified_by: 5})
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

    it('should return Bad Request on non-existing entity_ref', done => {
      service.put('/v1/community/1/action/1')
      .send({modified_by: 1, entity_ref: 77})
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Entity does not exist/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Entity 77 does not exist/);
          expect(error.details).to.have.property('data');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return Bad Request on entity_ref belonging to another community', done => {
      service.put('/v1/community/1/action/1')
      .send({modified_by: 1, entity_ref: 2})
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

    it('should return Not Found on non-existing profile_ref', done => {
      service.put('/v1/community/1/action/1')
      .send({modified_by: 1, profile_ref: 78})
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Profile does not exist/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Profile 78 does not exist/);
          expect(error.details).to.have.property('data');
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return Bad Request on profile_ref belonging to another community', done => {
      service.put('/v1/community/1/action/1')
      .send({modified_by: 1, profile_ref: 5})
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

    const user_id = 3;
    const id = 2;
    const url = `/v1/community/1/action/${id}`;

    it('should mark as deleted when modified_by is only field', done => {
      service.put(url)
      .send({modified_by: user_id})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expectValidate(data, 'v1/schemas/action-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(2);
          expect(data).to.have.property('type');
          expect(data.type).to.equal('like');
          expect(data).to.have.property('entity_ref');
          expect(data.entity_ref).to.match(/^[0-9]+$/);
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
      const url2 = '/v1/community/1/action/4';
      // Get original entity.
      service.get(url2)
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.have.property('attributes');
          const attributes = data.attributes;
          // Update entity
          service.put(url2)
          .send({end_epoch: 1488363030, attributes, modified_by: 2})
          .expect(200)
          .expect(res2 => {
            expectSuccess(res2.body, (links2, data2) => {
              expectValidate(data2, 'v1/schemas/action-out.json');
              expect(data2.log).to.have.length(1);
              const log = data2.log[0];
              expect(log).to.not.have.property('type');
              expect(log).to.not.have.property('end_epoch');
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
      .send({modified_by: user_id, type: 'check'})
      .expect(200)
      .then(() => {
        service.get(url)
        .expect(200)
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expectValidate(data, 'v1/schemas/action-out.json');
            expect(data.type).to.equal('check');
            expect(data.log).to.have.length(1);
            const log = data.log[0];
            expect(log).to.have.property('type');
            expect(log.type).to.equal('like');
            expect(log).to.not.have.property('attributes');
          });
        })
        .end(done);
      })
      .catch(error => {
        done(error);
      });
    });

    it('should update existing action and retrieve the update', done => {
      // Arrange
      service.put(url)
      .send({
        type: 'link',
        start_epoch: 148837000,
        end_epoch: 1488370996,
        entity_ref: 1,
        profile_ref: 1,
        modified_by: user_id,
        attributes: {
          description: 'kan ikke forstå'
        }
      })
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expectValidate(data, 'v1/schemas/action-out.json');
        });
      })
      .then(() => {
        service.get(url)
        .expect(200)
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(links).to.have.property('self');
            expect(links.self).to.equal(url);
            expectValidate(data, 'v1/schemas/action-out.json');
            expect(data).to.have.property('id');
            expect(data.id).to.equal(id);
            expect(data).to.have.property('type');
            expect(data.type).to.equal('link');
            expect(data).to.have.property('attributes');
            expect(data.attributes).to.deep.equal({
              description: 'kan ikke forstå'
            });
            expect(data).to.have.property('created_epoch');
            expect(data.created_epoch).to.match(/^[0-9]+$/);
            expect(data).to.have.property('modified_epoch');
            expect(data.modified_epoch).to.match(/^[0-9]+$/);
            expect(data.modified_epoch).to.not.be.below(data.created_epoch);
            expect(data).to.have.property('modified_by');
            expect(data.modified_by).to.be.equal(user_id);
            expect(data).to.have.property('deleted_epoch');
            expect(data.deleted_epoch).to.be.null;
            expect(data).to.have.property('log');
            expect(data.log).to.not.be.null;
            expect(data.log.length).to.be.equal(1);
            const log = data.log[0];
            expect(log).to.have.property('type');
            expect(log).to.not.have.property('attributes');
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
