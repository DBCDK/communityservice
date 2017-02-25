/*
 * Routes for version 1 endpoints.
 */

'use strict';

const express = require('express');
const router = express.Router();

router.use('/community', require('server/v1/community'));
router.use('/community/:community/profile', require('server/v1/profile'));
router.use('/community/:community/entity', require('server/v1/entity'));
router.use('/community/:community/action', require('server/v1/action'));

module.exports = router;
