'use strict';

const api = '/v2';

function communityToUrl (community) {
  return `${api}/community/${community}`;
}

function profileToUrl (community, profile) {
  if (profile) {
    return `${api}/community/${community}/profile/${profile}`;
  }
  return null;
}

function entityToUrl (community, entity) {
  if (entity) {
    return `${api}/community/${community}/entity/${entity}`;
  }
  return null;
}

function actionFromDb (dbRecord) {
  return {
    type: dbRecord.type,
    owner: profileToUrl(dbRecord.community_id, dbRecord.owner_id),
    community: communityToUrl(dbRecord.community_id),
    created_epoch: dbRecord.created_epoch,
    start_epoch: dbRecord.start_epoch,
    end_epoch: dbRecord.end_epoch,
    deleted_by: profileToUrl(dbRecord.community_id, dbRecord.deleted_by),
    deleted_epoch: dbRecord.deleted_epoch,
    modified_by: profileToUrl(dbRecord.community_id, dbRecord.modified_by),
    modified_epoch: dbRecord.modified_epoch,
    entity_ref: entityToUrl(dbRecord.community_id, dbRecord.entity_ref),
    profile_ref: profileToUrl(dbRecord.community_id, dbRecord.profile_ref),
    attributes: dbRecord.attributes,
    log: dbRecord.log
  };
}

function idsFromUrl (url) {
  const matcher = new RegExp('^/v([1-9])/community/([0-9]+)(/([^/]+)/([0-9]+))?$');
  const matches = url.match(matcher);
  if (!matches) {
    return null;
  }
  const version = parseInt(matches[1], 10);
  if (version !== 2) {
    return null;
  }
  const community = parseInt(matches[2], 10);
  const type = matches[4];
  if (type !== 'profile' && type !== 'entity') {
    return null;
  }
  let ids = {community};
  ids[type] = parseInt(matches[5], 10);
  return ids;
}

module.exports = {
  actionFromDb,
  idsFromUrl
};
