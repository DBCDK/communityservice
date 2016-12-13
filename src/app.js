/**
 * @file
 * Configure and start the server
 */

// Libraries
import Koa from 'koa';
import router from './routes/index.routes';
import cors from 'koa-cors'; // @see https://github.com/evert0n/koa-cors
import convert from 'koa-convert';
import responseTime from 'koa-response-time';
import Knex from 'knex';
import {Model} from 'objection';

// Middleware
import {LoggerMiddleware} from './middlewares/logger.middleware';
import ctxdump from './middlewares/ctxdump.middleware';
import {SetVersionHeader} from './middlewares/headers.middleware';

// Utils
import {CONFIG, validateConfig} from './utils/config.util';
import {log} from './utils/logging.util';

export function startServer() {
  validateConfig();
  const app = new Koa();
  app.name = 'CommunityService';
  const PORT = CONFIG.app.port;

  // Initialize knex
  const knex = Knex(CONFIG.postgres);
  // Bind all Models to a knex instance. If you only have one database in
  // your server this is all you have to do. For multi database systems, see
  // the Model.bindKnex method.
  Model.knex(knex);

  app.use(responseTime()); // This middleware should be placed as the very first to ensure that responsetime is correctly calculated
  app.use(LoggerMiddleware);
  app.use(SetVersionHeader);

  // Use CORS
  const corsOptions = {
    origin: '*',
    methods: 'GET POST OPTIONS',
    headers: 'Authorization, Origin, X-Requested-With, Content-Type, Accept'
  };

  app.use(convert(cors(corsOptions)));

  // trust ip-addresses from X-Forwarded-By header, and log requests
  app.proxy = true;

  app.use(router);

  if (CONFIG.app.env !== 'production') {
    app.use(ctxdump);
  }

  app.on('error', (err) => {
    log.error('Server error', {error: err.message, stack: err.stack});
  });

  app.listen(PORT, () => {
    log.debug(`Server is up and running on port ${PORT}!`);
  });
}
