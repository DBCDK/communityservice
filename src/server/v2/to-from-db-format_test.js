/* eslint-disable no-unused-expressions */
'use strict';

const {expect} = require('chai');
const {actionFromDb, idsFromUrl} = require('./to-from-db-format');

describe('Transformation to and from database', () => {

  describe('actionFromDb', () => {
    it('should replace ids with URLs', () => {
      expect(actionFromDb({
        id: 1,
        created_epoch: 1511960870,
        deleted_epoch: null,
        modified_epoch: 1511960870,
        modified_by: null,
        deleted_by: 3,
        community_id: 4,
        owner_id: 5,
        start_epoch: null,
        end_epoch: null,
        entity_ref: 6,
        profile_ref: 7,
        type: 'follow',
        attributes: {},
        log: null
      })).to.deep.equal({
        created_epoch: 1511960870,
        deleted_epoch: null,
        modified_epoch: 1511960870,
        modified_by: null,
        deleted_by: '/v2/community/4/profile/3',
        community: '/v2/community/4',
        owner: '/v2/community/4/profile/5',
        start_epoch: null,
        end_epoch: null,
        entity_ref: '/v2/community/4/entity/6',
        profile_ref: '/v2/community/4/profile/7',
        type: 'follow',
        attributes: {},
        log: null
      });
    });
  });

  describe('idsFromUrl', () => {
    it('should give null on malformed entries', () => {
      expect(idsFromUrl('/v9/community/1/profile/3')).to.be.null;
      expect(idsFromUrl('/v2/comm/1')).to.be.null;
      expect(idsFromUrl('/v2/community/1/foo/3')).to.be.null;
    });
    it('should extract community & profile', () => {
      expect(idsFromUrl('/v2/community/1/profile/3')).to.deep.equal({
        community: 1,
        profile: 3
      });
    });
    it('should extract community & entity', () => {
      expect(idsFromUrl('/v2/community/2/entity/11')).to.deep.equal({
        community: 2,
        entity: 11
      });
    });

  });

});
