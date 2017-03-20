'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const expectSuccess = require('server/test-verifiers').expectSuccess;
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/v1/current-db')(knex);
const exec = require('child-process-promise').exec;

/* eslint-disable no-unused-expressions */
describe('API v1 user story queries', () => {
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

  it('to display the best books As a community developer I want to find the most recent reviews that give the highest rating', done => {
    service.post('/v1/community/1/query')
    .send({
      Entities: {
        type: 'review',
        created_epoch: {operator: 'newerThan', value: 14, unit: 'daysAgo'}
      },
      Limit: 8,
      SortBy: 'attributes.rating',
      Order: 'descending',
      Include: {
        id: 'id',
        profile: {
          Profile: {id: '^owner_id'},
          Include: {id: 'id', name: 'name'}
        }
      }
    })
    .expect(res => {
      expectSuccess(res.body, (links, data) => {
        expect(data).to.deep.equal({
          Total: 1985,
          NextOffset: 8,
          List: [
            {
              id: 693,
              profile: {
                id: 16,
                name: 'Tiffany'
              }
            },
            {
              id: 705,
              profile: {
                id: 23,
                name: 'Nella'
              }
            },
            {
              id: 700,
              profile: {
                id: 16,
                name: 'Tiffany'
              }
            },
            {
              id: 689,
              profile: {
                id: 15,
                name: 'Shaylee'
              }
            },
            {
              id: 679,
              profile: {
                id: 6,
                name: 'Janae'
              }
            },
            {
              id: 680,
              profile: {
                id: 6,
                name: 'Janae'
              }
            },
            {
              id: 718,
              profile: {
                id: 28,
                name: 'Jalyn'
              }
            },
            {
              id: 706,
              profile: {
                id: 23,
                name: 'Nella'
              }
            }
          ]
        });
      });
    })
    .expect(200)
    .end(done);
  });

  it('to approve new reviews As admin I want to search for reviews that need approval', done => {
    service.post('/v1/community/1/query')
    .send({
      Entities: {type: 'review', 'attributes.approvedBy': null},
      Limit: 100,
      Order: 'ascending',
      Include: {
        id: 'id',
        review: 'contents',
        image: 'attributes.picture',
        profile: {
          Profile: {id: '^owner_id'},
          Include: {id: 'id', name: 'name'}
        }
      }
    })
    .expect(res => {
      // console.log(JSON.stringify(res.body));
      expectSuccess(res.body, (links, data) => {
        expect(data).to.deep.equal({
          Total: 0,
          NextOffset: null,
          List: []
        });
      });
    })
    .expect(200)
    .end(done);
  });

});
