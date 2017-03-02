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
      return seedSmallDb(knex);
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
          expect(list.length).to.equal(4);
          list.forEach(data => {
            expectValidate(data, 'v1/schemas/profile-out.json');
            expect(data).to.have.property('id');
            expect(data).to.have.property('name');
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
            expect(data).to.have.property('log');
            expect(data.log).to.be.null;
          });
          expect(list[0].name).to.equal('Pink ');
          expect(list[0].attributes).to.have.property('description');
          expect(list[0].attributes.description).to.deep.equal(
            'Jeg er en pige på 11 år og jeg elsker at høre musik og at være sammen med mine venner.'
          );
          expect(list[0].attributes).to.have.property('email');
          expect(list[0].attributes.email).to.deep.equal('pink@gmail.com');
          expect(list[0].attributes).to.have.property('libraryId');
          expect(list[0].attributes.libraryId).to.deep.equal(654321);
          expect(list[1].name).to.equal('Kaptajn underhyler');
          expect(list[1].attributes.description).to.deep.equal('Jeg er superhelt\nuden bukser på.');
          expect(list[1].attributes.email).to.deep.equal('under_hyler@ebrev.dk');
          expect(list[1].attributes.libraryId).to.deep.equal(648485);
        });
      })
      .end(done);
    });

    it('should return Not Found for non-existent community', done => {
      service.get('/v1/community/99/profile')
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

  describe('POST /community/:id/profile', () => {

    it('should return Not Found for non-existent community', done => {
      service.post('/v1/community/99/profile')
      .send({name: 'Låtte Østergærde'})
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
      service.post('/v1/community/1/profile')
      .send({})
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
      const id = 6;
      const location = `/v1/community/1/profile/${id}`;
      service.post('/v1/community/1/profile')
      .send({name})
      .expect(201)
      .expect('location', location)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(location);
          expectValidate(data, 'v1/schemas/profile-out.json');
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
          expect(data).to.have.property('log');
          expect(data.log).to.be.null;
        });
      })
      .end(done);
    });
  });

  describe('GET /community/:id/profile/:id', () => {

    it('should return Not Found on unknown profile', done => {
      service.get('/v1/community/1/profile/100')
      .expect(404)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Profile does not exist/);
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return Not Found for non-existent community', done => {
      service.get('/v1/community/99/profile/1')
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

    it('should return Not Found when profile does not belong to community', done => {
      service.get('/v1/community/2/profile/1')
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = errors[0];
          expect(error).to.have.property('title');
          expect(error.title).to.match(/Profile does not belong to community/);
          expect(error).to.have.property('details');
          expect(error.details).to.have.property('problem');
          expect(error.details.problem).to.match(/Profile 1 does not belong to community 2/);
          expect(error).to.have.property('meta');
          expect(error.meta).to.have.property('resource');
        });
      })
      .end(done);
    });

    it('should return specific profile');
  });

  describe('PUT /community/:id/profile/:id', () => {

    it('should reject non-conformant JSON', done => {
      service.put('/v1/community/1/profile/1')
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

    it('should return Not Found when profile does not belong to community', done => {
      service.put('/v1/community/99/profile/1')
      .send({name: 'Name', modified_by: 1})
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

    it('should return Not Found on any non-existing profile for modifier', done => {
      service.put('/v1/community/1/profile/1')
      .send({name: 'Name', modified_by: 98})
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
      service.put('/v1/community/1/profile/1')
      .send({name: 'Name', modified_by: 5})
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

    const id = 3;
    const url = `/v1/community/1/profile/${id}`;

    it('should mark as deleted when modified_by is only field', done => {
      service.put(url)
      .send({modified_by: id})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expectValidate(data, 'v1/schemas/profile-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(id);
          expect(data).to.have.property('name');
          expect(data.name).to.equal('BiblioteKaren');
          expect(data).to.have.property('attributes');
          expect(data).to.have.property('created_epoch');
          expect(data.created_epoch).to.match(/^[0-9]+$/);
          expect(data).to.have.property('modified_epoch');
          expect(data.modified_epoch).to.be.null;
          expect(data).to.have.property('modified_by');
          expect(data.modified_by).to.be.null;
          expect(data).to.have.property('deleted_epoch');
          expect(data.deleted_epoch).to.match(/^[0-9]+$/);
          expect(data.deleted_epoch).to.not.be.below(data.created_epoch);
          expect(data).to.have.property('deleted_by');
          expect(data.deleted_by).to.equal(id);
          expect(data).to.have.property('log');
          expect(data.log).to.be.null;
        });
      })
      .end(done);
    });

    it('should update log with minimal attributes', done => {
      const url2 = '/v1/community/1/profile/2';
      // Get original profile.
      service.get(url2)
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          // Update profile.
          service.put(url2)
          .send({name: 'Onkel Reje', attributes: data.attributes, modified_by: 2})
          .expect(200)
          .expect(res2 => {
            expectSuccess(res2.body, (links2, data2) => {
              expect(data2.log).to.have.length(1);
              const log = data2.log[0];
              expect(log).to.have.property('name');
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

    it('should update existing profile and retrieve the update', done => {
      const admin_id = 1;
      const newAttributes = {libraryId: 526443, interests: ['carrots', 'rabbit holes'], description: null};
      const totalAttributes = {libraryId: 526443, interests: ['carrots', 'rabbit holes'], email: 'Karen.Nielsen@rkb.dk'};
      service.put(url)
      .send({attributes: newAttributes, name: 'BiblioteKaren', modified_by: admin_id})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expectValidate(data, 'v1/schemas/profile-out.json');
          expect(data).to.have.property('id');
          expect(data.id).to.equal(id);
          expect(data).to.have.property('name');
          expect(data.name).to.equal('BiblioteKaren');
          expect(data).to.have.property('attributes');
          expect(data.attributes).to.deep.equal(totalAttributes);
          expect(data).to.have.property('created_epoch');
          expect(data.created_epoch).to.match(/^[0-9]+$/);
          expect(data).to.have.property('modified_epoch');
          expect(data.modified_epoch).to.match(/^[0-9]+$/);
          expect(data.modified_epoch).to.not.be.below(data.created_epoch);
          expect(data).to.have.property('modified_by');
          expect(data.modified_by).to.be.equal(admin_id);
          expect(data).to.have.property('deleted_epoch');
          expect(data.deleted_epoch).to.be.null;
          expect(data).to.have.property('log');
          expect(data.log).to.not.be.null;
          expect(data.log.length).to.be.equal(1);
          const log = data.log[0];
          expect(log).to.not.have.property('name');
          expect(log).to.have.property('attributes');
          const attribs = log.attributes;
          expect(attribs).to.have.property('description');
          expect(attribs).to.have.property('email');
          expect(attribs).to.not.have.property('libraryId');
        });
      })
      .then(() => {
        service.get(url)
        .expect(200)
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(links).to.have.property('self');
            expect(links.self).to.equal(url);
            expectValidate(data, 'v1/schemas/profile-out.json');
            expect(data).to.have.property('id');
            expect(data.id).to.equal(id);
            expect(data).to.have.property('name');
            expect(data.name).to.equal('BiblioteKaren');
            expect(data).to.have.property('attributes');
            expect(data.attributes).to.deep.equal(totalAttributes);
            expect(data).to.have.property('created_epoch');
            expect(data.created_epoch).to.match(/^[0-9]+$/);
            expect(data).to.have.property('modified_epoch');
            expect(data.modified_epoch).to.match(/^[0-9]+$/);
            expect(data.modified_epoch).to.not.be.below(data.created_epoch);
            expect(data).to.have.property('modified_by');
            expect(data.modified_by).to.be.equal(admin_id);
            expect(data).to.have.property('deleted_epoch');
            expect(data.deleted_epoch).to.be.null;
            expect(data).to.have.property('log');
            expect(data.log).to.not.be.null;
            expect(data.log.length).to.be.equal(1);
            const log = data.log[0];
            expect(log).to.not.have.property('name');
            expect(log).to.have.property('attributes');
            const attribs = log.attributes;
            expect(attribs).to.have.property('description');
            expect(attribs).to.have.property('email');
            expect(attribs).to.not.have.property('libraryId');
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
