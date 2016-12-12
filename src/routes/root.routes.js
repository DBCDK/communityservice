/**
 * @file
 * Specifying the most simple routes
 */

import Router from 'koa-router'; // @see https://github.com/alexmingoia/koa-router
import {VERSION_PREFIX} from '../utils/version.util';
import {CONFIG} from '../utils/config.util';

const router = new Router({prefix: VERSION_PREFIX});

router.get('/', (ctx, next) => {
  ctx.body = 'Frontpage';
  next();
});

router.get('/health', (ctx, next) => {
  ctx.body = 'OK!';
  next();
});

export default router;
