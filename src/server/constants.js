'use strict';

const constants = {

  community: {
    table: 'communities'
  },

  profile: {
    table: 'profiles',
    keys: ['^id$', '^deleted_by$', '^modified_by$', '^name$', '^attributes\\.'],
    timeKeys: ['created_epoch', 'deleted_epoch', 'modified_epoch']
  },

  entity: {
    table: 'entities',
    keys: ['^id$', '^deleted_by$', '^modified_by$', '^owner_id$', '^entity_ref$', '^type$', '^title$', '^contents$', '^attributes\\.'],
    timeKeys: ['created_epoch', 'deleted_epoch', 'modified_epoch', 'start_epoch', 'end_epoch']
  },

  action: {
    table: 'actions',
    keys: ['^id$', '^deleted_by$', '^modified_by$', '^owner_id$', '^entity_ref$', '^profile_ref$', '^type$', '^attributes\\.'],
    timeKeys: ['created_epoch', 'deleted_epoch', 'modified_epoch', 'start_epoch', 'end_epoch']
  },

  extractors: ['Include', 'IncludeSwitch', 'IncludeEntitiesRecursively'],
  limitors: ['Limit', 'Offset', 'SortBy', 'Order'],
  options: ['include-deleted']

};

module.exports = function() {
  return Object.assign({}, constants);
};
