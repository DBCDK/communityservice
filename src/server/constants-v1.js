'use strict';

const constants = {
  communityTable: 'communities',
  profileTable: 'profiles',
  entityTable: 'entities',
  actionTable: 'actions'
};

module.exports = function() {
  return Object.assign({}, constants);
};
