/*
 * Common JSON validator functions for the API.
 */

'use strict';

const validator = require('is-my-json-valid/require');

function validateInput(req, schema) {
  return new Promise((resolve, reject) => {
    try {
      const validate = validator(schema);
      if (validate(req.body)) {
        return resolve();
      }
      const error = JSON.stringify(validate.errors);
      reject({
        status: 400,
        title: `Input data does not adhere to ${schema}`,
        meta: {resource: req.baseUrl, body: req.body, problems: error}
      });
    }
    catch (error) {
      reject(error);
    }
  });
}
exports.validateInput = validateInput;
