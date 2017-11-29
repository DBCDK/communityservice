'use strict';

module.exports = {
  formats: {
    semver: /^[0-9]+(\.[0-9]+(\.[0-9]+)?)?$/,
    community: /^\/v2\/community\/[0-9]+$/,
    profile: /^\/v2\/community\/[0-9]+\/profile\/[0-9]+$/,
    entity: /^\/v2\/community\/[0-9]+\/entity\/[0-9]+$/
  }
};
