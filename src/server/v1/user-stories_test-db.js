'use strict';

const expect = require('chai').expect;
const request = require('supertest');
const server = require('server');
const expectSuccess = require('server/test-verifiers').expectSuccess;
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/test-db')(knex);
const exec = require('child-process-promise').exec;

/* eslint-disable no-unused-expressions */
describe('API v1 user story queries', () => {
  const service = request(server);
  before(done => {
    db.dropAll()
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

  it('to display the best books as a community developer I want to find the most recent reviews that give the highest rating', done => {
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
              id: 680,
              profile: {
                id: 6,
                name: 'Janae'
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
              id: 693,
              profile: {
                id: 16,
                name: 'Tiffany'
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
              id: 705,
              profile: {
                id: 23,
                name: 'Nella'
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

  it('to approve new reviews as admin I want to search for reviews that need approval', done => {
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

  it('To show a Biblo-like profile page as developer I want to find all recent user activity', done => {
    service.post('/v1/community/1/query')
    .send({
      Profile: {
        id: '15'
      },
      Include: {
        stickers: 'attributes.stickers',
        group: {
          CountActions: {
            type: 'member',
            owner_id: '^id'
          }
        },
        avatar: 'attributes.avatar',
        name: 'name',
        description: 'attributes.description',
        reviews: {
          Entities: {
            type: 'review',
            owner_id: '^id'
          },
          Limit: 2,
          Include: {
            id: 'id',
            review: 'contents',
            rating: 'attributes.rating',
            image: 'attributes.image',
            name: 'title',
            sticker: 'attributes.sticker'
          }
        },
        activity: {
          Entities: {
            owner_id: '^id'
          },
          Limit: 2,
          IncludeEntitiesRecursively: {
            comment: {
              id: 'id',
              name: {
                Profile: {
                  id: '^id'
                },
                Include: 'name'
              },
              avatar: {
                Profile: {
                  id: '^id'
                },
                Include: 'attributes.avatar'
              },
              created: 'created_epoch',
              comment: 'contents',
              likes: {
                CountActions: {
                  entity_ref: 'id'
                }
              }
            },
            post: {
              id: 'id',
              name: {
                Profile: {
                  id: '^owner_id'
                },
                Include: 'name'
              },
              avatar: {
                Profile: {
                  id: '^owner_id'
                },
                Include: 'attributes.avatar'
              },
              created: 'created_epoch',
              post: 'contents',
              likes: {
                CountActions: {
                  entity_ref: '^id'
                }
              }
            },
            group: {
              id: 'id',
              name: 'title'
            }
          }
        },
        messages: {
          Actions: {
            type: 'fine',
            profile_ref: '^id'
          },
          Limit: 3,
          Include: {
            id: 'id',
            modifed: 'modified_epoch',
            type: 'type',
            returnDate: 'attributes.returnDate',
            title: 'attributes.workTitle'
          }
        }
      }
    })
    .expect(res => {
      expectSuccess(res.body, (links, data) => {
        expect(data.group).to.equal(1);
        expect(data.avatar).to.deep.equal('https://s3.amazonaws.com/uifaces/faces/twitter/iqbalperkasa/128.jpg');
        expect(data.name).to.equal('Shaylee');
        expect(data.reviews.Total).to.equal(10);
        expect(data.reviews.NextOffset).to.equal(2);
        expect(data.reviews.List.length).to.equal(2);
        expect(data.activity.Total).to.equal(29);
        expect(data.activity.NextOffset).to.equal(2);
        expect(data.activity.List.length).to.equal(2);
      });
    })
    .expect(200)
    .end(done);
  });
});
