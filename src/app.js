/**
 * @file
 * Configure and start the server
 */

// Libraries
import Koa from 'koa';
import serve from 'koa-static';
import router from './routes/index.routes';
import cors from 'koa-cors'; // @see https://github.com/evert0n/koa-cors
import convert from 'koa-convert';
import Pug from 'koa-pug';
import responseTime from 'koa-response-time';
import session from 'koa-session2';
import Knex from 'knex';
import {Model} from 'objection';
import Session from './models/db_models/session.model';

// Middleware
import {LoggerMiddleware} from './middlewares/logger.middleware';
import {SetVersionHeader} from './middlewares/headers.middleware';
import {SessionMiddleware} from './middlewares/session.middleware';
import {stateMiddleware} from './middlewares/state.middleware';
import ctxdump from './middlewares/ctxdump.middleware';

// Utils
import {CONFIG, validateConfig} from './utils/config.util';
import {VERSION} from './utils/version.util';
import {log} from './utils/logging.util';
import {cacheAgencies} from './utils/agencies.util';

// Components
import SessionStore from './components/SessionStore/SessionStore.component';

export function startServer() {
  validateConfig();
  const app = new Koa();
  app.name = 'Adgangsplatformen';
  const PORT = CONFIG.app.port;

  // Initialize knex.
  const knex = Knex(CONFIG.postgres);

  // Add pug
  const pug = new Pug({
    viewPath: 'src/Templates',
    debug: true,
    compileDebug: true,
    noCache: CONFIG.app.env !== 'production',
    pretty: CONFIG.app.env !== 'production',
    locals: {
      version: VERSION
    }
  });

  pug.use(app);

  // Bind all Models to a knex instance. If you only have one database in
  // your server this is all you have to do. For multi database systems, see
  // the Model.bindKnex method.
  Model.knex(knex);

  // Making a query to db to ensure it is possible to connect
  Session.query().count('*')
    .catch((e) => {
      log.error('Query failed', {error: e.message, stack: e.stack});
    });

  app.use(session({
    store: new SessionStore(CONFIG.mock_storage.session),
    key: 'sid',
    maxAge: CONFIG.session.life_time,
    secure: CONFIG.app.env === 'production',
    path: '/',
    httpOnly: true
  }));

  app.use(convert(serve('./static', {
    maxage: CONFIG.app.env !== 'production' ? 0 : 2628000000 // one month
  })));

  app.use(SessionMiddleware);
  app.use(stateMiddleware);
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

  cacheAgencies(CONFIG.app.env === 'test' ? 'ringe' : '');

  app.use(router);

  if (CONFIG.app.env !== 'production') {
    app.use(ctxdump);
  }

  app.on('error', (err) => {
    log.error('Server error', {error: err.message, stack: err.stack});
  });

  app.listen(PORT, () => {
    log.debug(`Server is up and running on port ${PORT}!`, {sessionLifetime: CONFIG.session.life_time});
  });
}
