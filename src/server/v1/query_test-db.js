'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const expectSuccess = require('server/test-verifiers').expectSuccess;
const expectFailure = require('server/test-verifiers').expectFailure;
// const config = require('server/config');
// const dbconfig = config.db;
// const knex = require('knex')(dbconfig);
// const db = require('server/v1/current-db')(knex);
// const exec = require('child-process-promise').exec;

/* eslint-disable no-unused-expressions */
describe('API v1 query endpoint', () => {
  const service = request(server);
  /*
  before(done => {
    db.destroy()
    .then(db.setup)
    .then(() => {
      return exec('./seed-db.sh');
    })
    .then(() => {
      done();
    })
    .catch(errors => {
      console.log(errors); // eslint-disable-line no-console
      done(errors);
    });
  });
  */
  describe('parsing', () => {

    it('should reject an empty query', done => {
      service.post('/v1/community/1/query')
      .send({})
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(errors[0], {});
        });
      })
      .end(done);
    });

    it('should reject a query with no selector', done => {
      const query = {Find: {}, Include: 'name'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(errors[0], query);
        });
      })
      .end(done);
    });

    it('should accept CountActions selector', done => {
      service.post('/v1/community/1/query')
      .send({CountActions: {}})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          // TODO:
          expect(data).to.deep.equal('Not implemented');
        });
      })
      .end(done);
    });

    it('should accept CountEntities selector', done => {
      service.post('/v1/community/1/query')
      .send({CountEntities: {}})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          // TODO:
          expect(data).to.deep.equal('Not implemented');
        });
      })
      .end(done);
    });

    it('should accept CountProfiles selector', done => {
      service.post('/v1/community/1/query')
      .send({CountProfiles: {}})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          // TODO:
          expect(data).to.deep.equal('Not implemented');
        });
      })
      .end(done);
    });

    it('should reject Profile selector without extractor');

    it('should accept Profile selector', done => {
      service.post('/v1/community/1/query')
      .send({Profile: {id: 1}, Include: 'name'})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          // TODO:
          expect(data).to.deep.equal('Not implemented');
        });
      })
      .end(done);
    });

    it('should accept Action selector', done => {
      service.post('/v1/community/1/query')
      .send({Action: {id: 1}, Include: 'type'})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          // TODO:
          expect(data).to.deep.equal('Not implemented');
        });
      })
      .end(done);
    });

    it('should accept Entity selector', done => {
      service.post('/v1/community/1/query')
      .send({Entity: {id: 1}, Include: 'type'})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          // TODO:
          expect(data).to.deep.equal('Not implemented');
        });
      })
      .end(done);
    });
  });

  describe('generator', () => {
    it('should test something...');
  });
});

function expectErrorMalformed(error, query) {
  expect(error).to.have.property('title');
  expect(error.title).to.match(/query is malformed/i);
  expect(error).to.have.property('detail');
  expect(error).to.have.property('meta');
  expect(error.meta).to.have.property('query');
  expect(error.meta.query).to.deep.equal(query);
}
