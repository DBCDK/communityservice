/*
 * Routes for version 1 endpoints.
 */

'use strict';

const express = require('express');
const router = express.Router();

router.use('/community', require('server/v2/community'));
router.use('/community/:community/profile', require('server/v2/profile'));
router.use('/community/:community/entity', require('server/v2/entity'));
router.use('/community/:community/action', require('server/v2/action'));
router.use('/community/:community/query', require('server/v2/query'));

module.exports = router;
