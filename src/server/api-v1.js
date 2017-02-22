/*
 * Routes for version 1 endpoints.
 */

'use strict';

const express = require('express');
const router = express.Router();

router.use('/community', require('server/community-v1'));
router.use('/community/:community/profile', require('server/profile-v1'));
router.use('/community/:community/entity', require('server/entity-v1'));
router.use('/community/:community/action', require('server/action-v1'));

module.exports = router;
