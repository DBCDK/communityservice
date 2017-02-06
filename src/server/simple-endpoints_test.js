'use strict';

const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);

chai.use(chaiHttp);

/* eslint-disable no-unused-expressions */
describe('API v1 routes', () => {
  before(done => {
    knex.migrate.latest()
    .then(() => {
      return knex.seed.run();
    })
    .then(() => {
      done();
    })
    .catch(err => {
      done(err);
    });
  });
  describe('GET /v1/service', () => {
    it('should return all services', done => {
      chai.request(server)
      .get('/v1/service')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body.length).to.equal(2);
        expect(res.body[0]).to.have.property('name');
        expect(res.body[0].name).to.equal('Biblo');
        expect(res.body[1]).to.have.property('name');
        expect(res.body[1].name).to.equal('LiteraturSiden');
        done();
      })
      .catch(err => {
        done(err);
      });
    });
  });
});
