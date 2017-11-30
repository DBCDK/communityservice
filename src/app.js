'use strict';

const config = require('server/config');
const server = require('server');
const logger = require('__/logging')(config.logger);

const serverListener = server.listen(config.server.port, function() {
  logger.log.info('Service runs', {
    pid: process.pid,
    port: serverListener.address().port
  });
});
