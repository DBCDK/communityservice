'use strict';

const config = require('./config');
const server = require('./server');

const serverListener = server.listen(config.server.port, function() {
  console.log('PID='+process.pid); // eslint-disable-line no-console
  console.log('Port='+serverListener.address().port); // eslint-disable-line no-console
  // log.info('Service runs', {pid: process.pid, port: serverListener.address().port});
});
