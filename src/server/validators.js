/*
 * Common JSON validator functions for the API.
 */

'use strict';

const validator = require('is-my-json-valid/require');

function validateInput(req, schema) {
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
exports.validateInput = validateInput;
