'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const expectSuccess = require('server/test-verifiers').expectSuccess;
const expectFailure = require('server/test-verifiers').expectFailure;
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/v1/current-db')(knex);
const exec = require('child-process-promise').exec;

/* eslint-disable no-unused-expressions */
describe('API v1 query endpoint', () => {
  const service = request(server);
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
  describe('parsing', () => {

    it('should reject an empty query', done => {
      service.post('/v1/community/1/query')
      .send({})
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(errors[0], /must have exactly one selector/, {});
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
          expectErrorMalformed(errors[0], /must have exactly one selector/, query);
        });
      })
      .end(done);
    });

    it('should reject a query with more than one selector', done => {
      const query = {Profile: {}, Entity: {}, Include: 'name'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(errors[0], /must have exactly one selector/, query);
        });
      })
      .end(done);
    });

    describe('count selector', () => {

      it('should reject CountActions selector with extractor', done => {
        const query = {CountActions: {}, Include: 'id'};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(400)
        .expect(res => {
          expectFailure(res.body, errors => {
            expect(errors).to.have.length(1);
            expectErrorMalformed(errors[0], /cannot have any limitors or extractors/, query);
          });
        })
        .end(done);
      });

      it('should accept CountActions selector with empty criteria', done => {
        service.post('/v1/community/1/query')
        .send({CountActions: {}})
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal(4558);
          });
        })
        .expect(200)
        .end(done);
      });

      it('should accept CountEntities selector with empty criteria', done => {
        service.post('/v1/community/1/query')
        .send({CountEntities: {}})
        .expect(200)
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal(6903);
          });
        })
        .end(done);
      });

      it('should accept CountProfiles selector with empty criteria', done => {
        service.post('/v1/community/1/query')
        .send({CountProfiles: {}})
        .expect(200)
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal(1000);
          });
        })
        .end(done);
      });

      it('should accept CountActions selector with some criteria', done => {
        service.post('/v1/community/1/query')
        .send({CountActions: {type: 'like', owner_id: 147}})
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal(16);
          });
        })
        .expect(200)
        .end(done);
      });

      it('should accept CountActions selector with all equality criteria', done => {
        service.post('/v1/community/1/query')
        .send({CountActions: {
          type: 'like',
          owner_id: 147,
          deleted_by: null,
          id: 234,
          modified_by: 147,
          entity_ref: 353,
          profile_ref: 4
        }})
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal(0);
          });
        })
        .expect(200)
        .end(done);
      });

      it('should reject unknown criteria key that is substring of known key', done => {
        const query = {CountProfiles: {owner_id: 1}};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expect(errors).to.have.length(1);
            expectErrorMalformed(errors[0], /unknown key owner_id/, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should accept CountProfiles selector with all equality criteria', done => {
        service.post('/v1/community/1/query')
        .send({CountProfiles: {
          deleted_by: null,
          id: 234,
          modified_by: 147,
          name: 'Goofy'
        }})
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal(0);
          });
        })
        .expect(200)
        .end(done);
      });

      it('should accept CountProfiles selector with attribute criteria', done => {
        const query = {CountProfiles: {'attributes.admin': true}};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expect(errors).to.have.length(1);
            expectErrorMalformed(errors[0], /attribute matching not implemented/, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject criteria with unknown keys', done => {
        const query = {CountActions: {unknownKey: 'boom'}};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(400)
        .expect(res => {
          expectFailure(res.body, errors => {
            expect(errors).to.have.length(1);
            expectErrorMalformed(errors[0], /unknown key.*unknownKey/, query);
          });
        })
        .end(done);
      });

    });

    describe('singleton selector', () => {

      it('should reject Profile selector without extractor'/* , done => {
        const query = {Profile: {id: 1}};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(400)
        .expect(res => {
          expectFailure(res.body, errors => {
            expect(errors).to.have.length(1);
            expectErrorMalformed(errors[0], /must have an extractor/, query);
          });
        })
        .end(done);
      }*/);

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
          // console.log(JSON.stringify(res.body));
          expectSuccess(res.body, (links, data) => {
            // TODO:
            expect(data).to.deep.equal('Not implemented');
          });
        })
        .end(done);
      });
    });

    describe('list selector', () => {
    });

  });

  describe('generator', () => {
    it('should test something...');
  });
});

function expectErrorMalformed(error, pattern, query) {
  expect(error).to.have.property('title');
  expect(error.title).to.match(/query is malformed/i);
  expect(error).to.have.property('detail');
  expect(JSON.stringify(error.detail)).to.match(pattern);
  expect(error).to.have.property('meta');
  expect(error.meta).to.have.property('query');
  expect(error.meta.query).to.deep.equal(query);
}
