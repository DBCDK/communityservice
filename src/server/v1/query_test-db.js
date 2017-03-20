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
          expect(data).to.deep.equal(3844);
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
          expect(data).to.deep.equal(6436);
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
          expect(data).to.deep.equal(994);
        });
      })
      .end(done);
    });

    it('should accept CountActions selector with some criteria', done => {
      service.post('/v1/community/1/query')
      .send({CountActions: {type: 'like', owner_id: 211}})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal(35);
        });
      })
      .expect(200)
      .end(done);
    });

    it('should accept CountActions selector with all equality criteria', done => {
      service.post('/v1/community/1/query')
      .send({CountActions: {
        type: 'like',
        owner_id: 211,
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

    it('should accept CountProfiles selector with all equality criteria', done => {
      service.post('/v1/community/1/query')
      .send({CountProfiles: {
        deleted_by: null,
        id: 234,
        modified_by: 211,
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

    it('should not count deleted objects', done => {
      service.post('/v1/community/1/query')
      .send({CountEntities: {owner_id: 575}})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal(24);
        });
      })
      .expect(200)
      .end(done);
    });

  });

  describe('criteria', () => {

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

    it('should reject unknown criteria key that is substring of known key', done => {
      const query = {CountProfiles: {owner_id: 1}};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(errors[0], /unknown key.*owner_id/, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject time criteria with missing keys', done => {
      const query = {CountEntities: {end_epoch: {operator: 'newerThan', value: 0}}};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(errors[0], /exactly three properties expected in time-based comparison: operator, unit & value/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject time criteria with unknown keys', done => {
      const query = {CountEntities: {end_epoch: {operator: 'newerThan', days: 0}}};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(errors[0], /exactly three properties expected in time-based comparison: operator, unit & value/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject time criteria with unknown values', done => {
      const timeCriteria = {operator: '>', unit: 'weeks', value: 'a lot'};
      const query = {CountEntities: {end_epoch: timeCriteria}};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformedDetail(errors[0], 0, /operator must be one of: newerThan, olderThan/i, timeCriteria);
          expectErrorMalformedDetail(errors[0], 1, /unit must be one of: daysAgo/i, timeCriteria);
          expectErrorMalformedDetail(errors[0], 2, /value must be a number/i, timeCriteria);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should collect errors from several layers of queries', done => {
      const timeCriteria = {operator: '>', unit: 'weeks', value: 1};
      const refCriteria = {foo: '^id'};
      const query = {Profile: refCriteria, Include: {unrelated: {CountEntities: {end_epoch: timeCriteria}}}};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformedDetail(errors[0], 0, /unknown key.*foo/i, refCriteria);
          expectErrorMalformedDetail(errors[0], 1, /operator must be one of: newerThan, olderThan/i, timeCriteria);
          expectErrorMalformedDetail(errors[0], 2, /unit must be one of: daysAgo/i, timeCriteria);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should accept criteria for recent events', done => {
      service.post('/v1/community/1/query')
      .send({CountEntities: {
        type: 'campaign',
        end_epoch: {operator: 'newerThan', unit: 'daysAgo', value: 14}
      }})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal(37);
        });
      })
      .expect(200)
      .end(done);
    });

    it('should accept criteria for past events', done => {
      service.post('/v1/community/1/query')
      .send({CountEntities: {
        type: 'campaign',
        end_epoch: {operator: 'olderThan', unit: 'daysAgo', value: 0}
      }})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal(37);
        });
      })
      .expect(200)
      .end(done);
    });

    it('should reject deep attribute paths criteria', done => {
      const query = {CountProfiles: {'attributes.bundle.id': 1}};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(errors[0], /deep attribute paths are not supported/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should accept boolean attribute criteria', done => {
      const query = {CountProfiles: {'attributes.admin': true}};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal(10);
        });
      })
      .expect(200)
      .end(done);
    });

    it('should accept string attribute criteria', done => {
      const query = {CountProfiles: {'attributes.email': 'Dorthy4@hotmail.com'}};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal(1);
        });
      })
      .expect(200)
      .end(done);
    });

    it('should accept array attribute criteria?');
    it('should accept object attribute criteria?');

    it('should reject references to keys that do not exist in dynamic context', done => {
      const query = {CountProfiles: {deleted_by: '^id'}};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorDynamic(errors[0], /reference \^id does not exist in current context/i, query);
        });
      })
      .expect(400)
      .end(done);
    });
  });

  describe('singleton selector', () => {

    it('should reject selector without extractor', done => {
      const query = {Profile: {id: 1}};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(
            errors[0],
            /must have exactly one extractor.*Include, IncludeSwitch, IncludeEntitiesRecursively/i,
            query
          );
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject limitors', done => {
      const query = {Profile: {id: 1}, Limit: 10, Include: 'name'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(
            errors[0],
            /must not have additional properties, but found.*Include/i,
            query
          );
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject unknown keys', done => {
      const query = {Profile: {id: 1}, Follow: 'entity_ref', Include: 'name'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          expectErrorMalformed(
            errors[0],
            /must not have additional properties, but found.*Follow/i,
            query
          );
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject criteria with unknown keys', done => {
      const query = {Entity: {unknownKey: 'boom'}, Include: 'title'};
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

    it('should return dynamic error on empty search result', done => {
      const query = {Profile: {id: 987654}, Include: 'name'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expectErrorDynamic(errors[0], /no result/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should return dynamic error on more-than-one search result', done => {
      const query = {Profile: {}, Include: 'name'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expectErrorDynamic(errors[0], /several results/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should accept Profile selector', done => {
      service.post('/v1/community/1/query')
      .send({Profile: {id: 1}, Include: 'name'})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal('Marjolaine');
        });
      })
      .expect(200)
      .end(done);
    });

    it('should accept Action selector', done => {
      service.post('/v1/community/1/query')
      .send({Action: {id: 1}, Include: 'type'})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal('member');
        });
      })
      .expect(200)
      .end(done);
    });

    it('should accept Entity selector', done => {
      service.post('/v1/community/1/query')
      .send({Entity: {id: 1}, Include: 'type'})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal('group');
        });
      })
      .expect(200)
      .end(done);
    });

    it('should reject deleted entries', done => {
      const query = {Entity: {id: 475}, Include: 'title'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expectErrorDynamic(errors[0], /No result from singleton selector/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

  });

  describe('extractor', () => {

    describe('Include', () => {

      it('should accept simple direct property extractor', done => {
        service.post('/v1/community/1/query')
        .send({Profile: {id: 2}, Include: 'name'})
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal('Destinee');
          });
        })
        .expect(200)
        .end(done);
      });

      it('should accept simple direct attributes extractor', done => {
        service.post('/v1/community/1/query')
        .send({Profile: {id: 2}, Include: 'attributes.email'})
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal('Jessie.Langworth@gmail.com');
          });
        })
        .expect(200)
        .end(done);
      });

      it('should accept complex direct extractor', done => {
        service.post('/v1/community/1/query')
        .send({Profile: {id: 32}, Include: {number: 'id', who: 'name', email: 'attributes.email'}})
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal({number: 32, who: 'Estrella', email: 'Dorthy4@hotmail.com'});
          });
        })
        .expect(200)
        .end(done);
      });

      it('should accept extractor with subquery', done => {
        service.post('/v1/community/1/query')
        .send({Profile: {id: 32}, Include: {followers: {CountActions: {profile_ref: '^id'}}}})
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal({followers: 2});
          });
        })
        .expect(200)
        .end(done);
      });

      it('should reject malformed extractor rhs', done => {
        const query = {Profile: {id: 3}, Include: {ost: ['id']}};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /must be a string or a subquery/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject malformed subquery extractor', done => {
        const query = {Profile: {id: 3}, Include: {ost: {Count: {}}}};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /must have exactly one selector/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject malformed extractor', done => {
        const query = {Profile: {id: 3}, Include: ['id', 'name']};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /complex extractor must be an object/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject simple extractor with unknown key', done => {
        const query = {Profile: {id: 3}, Include: 'not_exist'};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /unknown key.*not_exist/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject complex extractor with unknown key', done => {
        const query = {Profile: {id: 3}, Include: {name: 'not_exist'}};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /unknown key.*not_exist/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject simple extractor with reference', done => {
        const query = {Profile: {id: 3}, Include: '^id'};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /references not allowed in extractors/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject complex extractor with reference', done => {
        const query = {Profile: {id: 3}, Include: {what: '^id'}};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /references not allowed in extractors/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

    });

    describe('IncludeSwitch', () => {

      it('should reject non-object arguments', done => {
        const query = {Actions: {owner_id: 3}, Limit: 5, IncludeSwitch: ['entity_ref']};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /switch must be an object/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject switch with extractor errors', done => {
        const extractor = {like: '^entity_ref', follow: ['follow_ref']};
        const query = {Actions: {owner_id: 68}, Limit: 5, IncludeSwitch: extractor};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /references not allowed in extractors/i, query);
            expectErrorMalformed(errors[0], /complex extractor must be an object/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject switch with unhandled type', done => {
        const extractor = {like: 'entity_ref'};
        const query = {Actions: {owner_id: 211}, Limit: 5, IncludeSwitch: extractor};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expect(errors.length).to.equal(1);
            expectErrorDynamic(errors[0], /entity type unhandled in switch: follow/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should accept simple switch', done => {
        const extractor = {like: 'entity_ref', follow: 'profile_ref'};
        const query = {Actions: {owner_id: 211}, Limit: 5, IncludeSwitch: extractor};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal({
              Total: 41,
              NextOffset: 5,
              List: [191, 575, 927, 211, 2547]
            });
          });
        })
        .expect(200)
        .end(done);
      });

      it('should accept complex switch', done => {
        const extractor = {
          like: {what: {Entity: {id: '^entity_ref'}, Include: 'title'}},
          follow: {who: {Profile: {id: '^profile_ref'}, Include: 'name'}}
        };
        const query = {Actions: {owner_id: 211}, Limit: 5, IncludeSwitch: extractor};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal({
              Total: 41,
              NextOffset: 5,
              List: [
                {who: 'Jamaal'},
                {who: 'Irving'},
                {who: 'Karianne'},
                {who: 'Barton'},
                {what: 'Velit rerum est'}
              ]
            });
          });
        })
        .expect(200)
        .end(done);
      });

    });

    describe('IncludeEntitiesRecursively', () => {

      it('should reject object not pointing to entities', done => {
        const query = {Profile: {id: 211}, IncludeEntitiesRecursively: {entity: 'entity_ref'}};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /object does not have an entity_ref to follow/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject non-object arguments', done => {
        const query = {Action: {id: 524}, IncludeEntitiesRecursively: 'entity_ref'};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /switch must be an object/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject switch with extractor errors', done => {
        const extractor = {like: {id: '^entity_ref'}, follow: ['follow_ref']};
        const query = {Action: {id: 524}, IncludeEntitiesRecursively: extractor};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /references not allowed in extractors/i, query);
            expectErrorMalformed(errors[0], /complex extractor must be an object/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject switch with simple extractor', done => {
        const extractor = {like: 'owner_id'};
        const query = {Action: {id: 524}, IncludeEntitiesRecursively: extractor};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expectErrorMalformed(errors[0], /simple extractors not allowed in recursive switch, but found: owner_id/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should reject switch with unhandled type', done => {
        const extractor = {member: {entity: 'entity_ref'}};
        const query = {Action: {id: 524}, IncludeEntitiesRecursively: extractor};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectFailure(res.body, errors => {
            expect(errors.length).to.equal(1);
            expectErrorDynamic(errors[0], /entity type unhandled in switch: group/i, query);
          });
        })
        .expect(400)
        .end(done);
      });

      it('should produce embedded structure in reverse order', done => {
        const extractor = {
          like: {id: 'id', who: 'owner_id'},
          post: {id: 'id', text: 'title'},
          group: {id: 'id', name: 'title'}
        };
        const query = {Action: {id: 524}, IncludeEntitiesRecursively: extractor};
        service.post('/v1/community/1/query')
        .send(query)
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal({
              group: {
                id: 62,
                name: 'Dolorum qui omnis',
                post: {
                  id: 246,
                  text: 'Iusto sapiente eum',
                  post: {
                    id: 2722,
                    text: 'Voluptas et vel',
                    post: {
                      id: 4128,
                      text: 'Asperiores eligendi rerum',
                      like: {
                        id: 524,
                        who: 61}}}}}});
          });
        })
        .expect(200)
        .end(done);
      });

      it('should blank out deleted entries', done => {
        const extractor = {
          post: {id: 'id', summary: 'title'},
          group: {id: 'id', name: 'title'}
        };
        service.post('/v1/community/1/query')
        .send({Entity: {id: 6177}, IncludeEntitiesRecursively: extractor})
        .expect(res => {
          expectSuccess(res.body, (links, data) => {
            expect(data).to.deep.equal({
              group: {
                id: 28,
                name: 'Dolorem accusantium deserunt',
                post: {
                  id: null,
                  summary: null,
                  deleted_by: 575,
                  deleted_epoch: 1489959016,
                  post: {
                    id: 5104,
                    summary: 'Aliquid nisi quae',
                    post: {
                      id: 6177,
                      summary: 'Enim beatae fugit'
                    }
                  }
                }
              }
            });
          });
        })
        .expect(200)
        .end(done);
      });

    });
  });

  describe('list selector', () => {

    it('should reject list selector without limit', done => {
      const query = {Entities: {}, Include: 'id'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expectErrorMalformed(errors[0], /list selector must have a Limit/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject list selector with non-numeric limit', done => {
      const query = {Entities: {}, Limit: 'a lot', Include: 'id'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expectErrorMalformed(errors[0], /list selector must have a numeric Limit/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject list selector with additional keys', done => {
      const query = {Entities: {}, Limit: 1, Include: 'id', Recursive: true};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expectErrorMalformed(errors[0], /list selector must not have additional properties, but found: Recursive/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject malformed limitors', done => {
      const query = {Entities: {}, Limit: 1, Offset: 'some', SortBy: 1, Order: 'upwards', Include: 'id'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expectErrorMalformedDetail(errors[0], 0, /list selector must have a numeric Offset, but found: some/i, query);
          expectErrorMalformedDetail(errors[0], 1, /list selector must sort by known property, but found: 1/i, query);
          expectErrorMalformedDetail(errors[0], 2, /list selector must order descending or ascending/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject malformed selector', done => {
      const query = {Profiles: {'attributes.admin.top': true}, Limit: 10, Include: 'name'};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expectErrorMalformed(errors[0], /deep attribute paths are not supported/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should reject malformed extractor', done => {
      const query = {Profiles: {}, Limit: 10, Include: ['id', 'name']};
      service.post('/v1/community/1/query')
      .send(query)
      .expect(res => {
        expectFailure(res.body, errors => {
          expectErrorMalformed(errors[0], /complex extractor must be an object/i, query);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should fill the list up if smaller than the limit', done => {
      service.post('/v1/community/1/query')
      .send({Profiles: {'attributes.admin': true}, Limit: 100, Include: 'id'})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal({
            Total: 10,
            NextOffset: null,
            List: [156, 968, 775, 601, 594, 534, 510, 476, 38, 55]
          });
        });
      })
      .expect(200)
      .end(done);
    });

    it('should limit the list', done => {
      service.post('/v1/community/1/query')
      .send({Entities: {owner_id: 32}, Limit: 10, Include: 'id'})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal({
            Total: 27,
            NextOffset: 10,
            List: [5731, 5732, 4967, 4262, 4259, 4261, 4260, 3470, 2692, 2690]
          });
        });
      })
      .expect(200)
      .end(done);
    });

    it('should offset the list', done => {
      service.post('/v1/community/1/query')
      .send({Entities: {owner_id: 32}, Limit: 5, Offset: 10, Include: 'id'})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal({
            Total: 27,
            NextOffset: 15,
            List: [2692, 737, 733, 735, 734]
          });
        });
      })
      .expect(200)
      .end(done);
    });

    it('should sort the list ascending', done => {
      service.post('/v1/community/1/query')
      .send({Actions: {owner_id: 32}, Limit: 5, Order: 'ascending', Include: 'id'})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal({
            Total: 21,
            NextOffset: 5,
            List: [96, 262, 464, 466, 462]
          });
        });
      })
      .expect(200)
      .end(done);
    });

    it('should leave out deleted entries', done => {
      service.post('/v1/community/1/query')
      .send({Entities: {owner_id: 575}, Limit: 5, SortBy: 'id', Order: 'ascending', Include: 'id'})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal({
            Total: 24,
            NextOffset: 5,
            List: [173, 476, 477, 478, 1863]
          });
        });
      })
      .expect(200)
      .end(done);
    });

  });

  describe('options', () => {

    it('should reject unknown options', done => {
      service.post('/v1/community/1/query/include-unicorns')
      .send({CountEntities: {owner_id: 575}})
      .expect(res => {
        expectFailure(res.body, errors => {
          expectErrorOptions(errors[0], /expected one of: include-deleted/i);
        });
      })
      .expect(400)
      .end(done);
    });

    it('should count deleted objects', done => {
      service.post('/v1/community/1/query/include-deleted')
      .send({CountEntities: {owner_id: 575}})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal(25);
        });
      })
      .expect(200)
      .end(done);
    });

    it('should not blank out deleted entries', done => {
      service.post('/v1/community/1/query/include-deleted')
      .send({Entity: {id: 475}, Include: 'title'})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.equal('Dicta aut rerum');
        });
      })
      .expect(200)
      .end(done);
    });

    it('should not blank out deleted entries in recursive queries', done => {
      const extractor = {
        post: {id: 'id', summary: 'title'},
        group: {id: 'id', name: 'title'}
      };
      service.post('/v1/community/1/query/include-deleted')
      .send({Entity: {id: 6177}, IncludeEntitiesRecursively: extractor})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal({
            group: {
              id: 28,
              name: 'Dolorem accusantium deserunt',
              post: {
                id: 475,
                summary: 'Dicta aut rerum',
                deleted_by: 575,
                deleted_epoch: 1489959016,
                post: {
                  id: 5104,
                  summary: 'Aliquid nisi quae',
                  post: {
                    id: 6177,
                    summary: 'Enim beatae fugit'
                  }
                }
              }
            }
          });
        });
      })
      .expect(200)
      .end(done);
    });

    it('should include deleted entries', done => {
      service.post('/v1/community/1/query/include-deleted')
      .send({Entities: {owner_id: 575}, Limit: 5, SortBy: 'id', Order: 'ascending', Include: 'id'})
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(data).to.deep.equal({
            Total: 25,
            NextOffset: 5,
            List: [173, 475, 476, 477, 478]
          });
        });
      })
      .expect(200)
      .end(done);
    });

  });

  describe('dynamic errors', () => {
    it('should handle database errors');
    it('should handle query errors');
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

function expectErrorOptions(error, pattern) {
  expect(error).to.have.property('title');
  expect(error.title).to.match(/unknown option/i);
  expect(error).to.have.property('detail');
  expect(JSON.stringify(error.detail)).to.match(pattern);
}

function expectErrorMalformedDetail(error, index, pattern, query) {
  expect(error).to.have.property('title');
  expect(error.title).to.match(/query is malformed/i);
  expect(error).to.have.property('detail');
  expect(error.detail.length).to.be.at.least(index + 1);
  const detail = error.detail[index];
  expect(JSON.stringify(detail)).to.match(pattern);
  expect(detail).to.have.property('query');
  expect(detail.query).to.deep.equal(query);
}

function expectErrorDynamic(error, pattern, query) {
  expect(error).to.have.property('title');
  expect(error.title).to.match(/Error during execution of query/i);
  expect(error).to.have.property('detail');
  expect(JSON.stringify(error.detail)).to.match(pattern);
  expect(error).to.have.property('meta');
  expect(error.meta).to.have.property('query');
  expect(error.meta.query).to.deep.equal(query);
}
