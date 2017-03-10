'use strict';

const constants = {

  communityTable: 'communities',
  profileTable: 'profiles',
  entityTable: 'entities',
  actionTable: 'actions',

  profileCriteriaKeys: ['id', 'deleted_by', 'modified_by', 'name', '^attributes\\.'],
  entityCriteriaKeys: ['id', 'deleted_by', 'modified_by', 'owner_id', 'entity_ref', 'type', 'title', 'contents', '^attributes\\.'],
  actionCriteriaKeys: ['id', 'deleted_by', 'modified_by', 'owner_id', 'entity_ref', 'profile_ref', 'type', '^attributes\\.'],

  profileCriteriaTimeKeys: ['created_epoch', 'deleted_epoch', 'modified_epoch'],
  entityCriteriaTimeKeys: ['created_epoch', 'deleted_epoch', 'modified_epoch', 'start_epoch', 'end_epoch'],
  actionCriteriaTimeKeys: ['created_epoch', 'deleted_epoch', 'modified_epoch', 'start_epoch', 'end_epoch']
};

module.exports = function() {
  return Object.assign({}, constants);
};
