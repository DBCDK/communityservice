'use strict';

const express = require('express');
const router = express.Router();
const routesCommunity = require('server/api-v1-community');

router.use('/community', routesCommunity);

module.exports = router;
