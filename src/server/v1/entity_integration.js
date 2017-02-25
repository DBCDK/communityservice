'use strict';

// const expect = require('chai').expect;
// const request = require('supertest');
// const server = require('server');
const config = require('server/config');
const dbconfig = config.db;
const knex = require('knex')(dbconfig);
const db = require('server/v1/current-db')(knex);
const seedBigDb = require('server/seeds/integration-test-big').seed;
// const expectSuccess = require('server/integration-verifiers').expectSuccess;
// const expectFailure = require('server/integration-verifiers').expectFailure;
// const expectValidate = require('server/integration-verifiers').expectValidate;

/* eslint-disable no-unused-expressions */
describe('API v1 entity endpoints', () => {
  // const service = request(server);
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
  describe('GET /community/:id/entity', () => {
    it('should return seeded entities');
    it('should return Not Found for non-existent community');
  });
  describe('POST /community/:id/entity', () => {
    it('should return Not Found for non-existent community');
    it('should reject missing type');
    it('should reject missing title');
    it('should reject missing contents');
    it('should reject malformed data');
    it('should reject non-conformant JSON');
    it('should add a new entity with type, title & contents');
    it('should add a new entity with entity_ref');
  });
  describe('GET /community/:id/entity/:id', () => {
    it('should return Not Found on unknown entity');
    it('should return Not Found when entity does not belong to community');
  });
  describe('PUT /community/:id/entity/:id', () => {
    it('should return Not Found when entity does not belong to community');
    it('should return Not Found on any non-existing entity');
    it('should return Bad Request on any non-existing profile for modifier');
    it('should mark as deleted when modified_by is only field');
    it('should update log with minimal attributes');
    it('should update existing entity with type');
    it('should update existing entity with title');
    it('should update existing entity with contents');
    it('should update existing entity with start_epoch');
    it('should update existing entity with end_epoch');
    it('should update existing entity with type, title, contents');
  });
  describe('GET /community/:id/entity/:id/attribute/:key', () => {
    it('should return Not Found for non-existent community');
    it('should return Not Found on any non-existing entity');
    it('should return Not Found for non-existent key');
    it('should retrieve a value by key');
  });
  describe('GET /community/:id/entity/:id/attribute', () => {
    it('should return Not Found when entity does not belong to community');
    it('should return Not Found on any non-existing entity');
    it('should retrieve all attributes');
    it('should retrieve empty set of attributes');
  });
  describe('POST /community/:id/entity/:id/attribute', () => {
    it('should return Not Found when entity does not belong to community');
    it('should return Not Found on any non-existing entity');
    it('should return Conflict on an existing key');
    it('should add a new key-value pair');
  });
});
