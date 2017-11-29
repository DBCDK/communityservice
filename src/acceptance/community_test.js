/* eslint-disable no-unused-expressions */
'use strict';

const {expect} = require('chai');
const request = require('supertest');
const {expectSuccess, expectFailure, expectValidate} = require('./output-verifiers');
const mock = require('./mock-server');

describe('API v2 community endpoints', () => {
  const service = request(mock.server);
  beforeEach(async () => {
    await mock.beforeEach();
  });
  afterEach(() => {
    mock.afterEach();
  });

  describe('GET /community', () => {

    it('should return seeded communities', () => {
      const url = '/v2/community';
      return service.get(url)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expectSuccess(res.body, (links, list) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expect(list.length).to.equal(2);
          list.forEach(data => {
            expectValidate(data, 'schemas/community-out.json');
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
      });
    });
  });

  describe('GET /community/:name', () => {

    it('should return Not Found on unknown name', () => {
      const url = '/v2/community/Osten Feldt';
      return service.get(url)
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
      });
    });

    it('should locate community by name', () => {
      return service.get('/v2/community/Biblo')
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal('/v2/community/1');
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
      });
    });
  });

  describe('GET /community/:id', () => {

    it('should return Not Found on unknown community', () => {
      const url = '/v2/community/10';
      return service.get(url)
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
      });
    });
  });

  describe('PUT /community/:id', () => {

    it('should return Not Found on any non-existing community', () => {
      const url = '/v2/community/10';
      return service.put(url)
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
      });
    });
  });

  describe('POST /community', () => {

    it('should reject missing data', () => {
      return service.post('/v2/community')
      .send('')
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/field.*name.*is required/);
        });
      });
    });

    it('should reject malformed data', () => {
      return service.post('/v2/community')
      .send('My community')
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/JSON syntax error/);
        });
      });
    });

    it('should reject JSON with excess fields', () => {
      return service.post('/v2/community')
      .send({name: 'My community', ost: 'Extra field'})
      .expect(400)
      .expect(res => {
        expectFailure(res.body, errors => {
          expect(errors).to.have.length(1);
          const error = JSON.stringify(errors[0]);
          expect(error).to.match(/has additional properties/);
        });
      });
    });

    it('should add a new community with just a name', () => {
      const name = 'Sære Litterater';
      const id = 3;
      const location = `/v2/community/${id}`;
      return service.post('/v2/community')
      .send({name})
      .expect('location', location)
      .expect(201)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(location);
          expectValidate(data, 'schemas/community-out.json');
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
      });
    });
  });

  describe('PUT /community/:id', () => {

    const name = 'Søde Litterater';
    const newAttributes = {test: true};
    const oldAttributes = {production: false};
    const totalAttributes = Object.assign({}, oldAttributes, newAttributes);
    const id = 2;
    const url = `/v2/community/${id}`;

    it('should update existing community and retrieve the update', () => {
      return service.put(url)
      .send({name, attributes: newAttributes})
      .expect(200)
      .expect(res => {
        expectSuccess(res.body, (links, data) => {
          expect(links).to.have.property('self');
          expect(links.self).to.equal(url);
          expectValidate(data, 'schemas/community-out.json');
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
            expectValidate(data, 'schemas/community-out.json');
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
        });
      });
    });
  });
});
