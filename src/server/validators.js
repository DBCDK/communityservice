/*
 * Common JSON validator functions for the API.
 */

'use strict';

const config = require('server/config');
const knex = require('knex')(config.db);
const validator = require('is-my-json-valid/require');
const communityTable = 'communities';
const profileTable = 'profiles';

function validatingInput(req, schema) {
  return new Promise((resolve, reject) => {
    try {
      const validate = validator(schema, {verbose: true});
      if (validate(req.body)) {
        return resolve();
      }
      reject({
        status: 400,
        title: `Input data does not adhere to ${schema}`,
        meta: {resource: req.baseUrl, body: req.body, problems: validate.errors}
      });
    }
    catch (error) {
      reject(error);
    }
  });
}
exports.validatingInput = validatingInput;

function verifyingCommunityExists(id, url) {
  return new Promise((resolve, reject) => {
    knex(communityTable).where('id', id).select()
    .then(communities => {
      if (!communities || communities.length !== 1) {
        reject({
          status: 404,
          title: 'Community does not exist',
          meta: {resource: url}
        });
      }
      resolve();
    })
    .catch(error => {
      reject(error);
    });
  });
}
exports.verifyingCommunityExists = verifyingCommunityExists;

function verifyingProfileExists(id, url) {
  return new Promise((resolve, reject) => {
    knex(profileTable).where('id', id).select()
    .then(profiles => {
      if (!profiles || profiles.length !== 1) {
        reject({
          status: 404,
          title: 'Profile does not exist',
          meta: {resource: url}
        });
      }
      resolve();
    })
    .catch(error => {
      reject(error);
    });
  });
}
exports.verifyingProfileExists = verifyingProfileExists;
