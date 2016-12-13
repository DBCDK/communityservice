/**
 * @file
 * Specifying the most simple routes
 */

import Router from 'koa-router'; // @see https://github.com/alexmingoia/koa-router

const router = new Router();

router.get('/', (ctx, next) => {
  ctx.body = 'Frontpage';
  next();
});

router.get('/health', (ctx, next) => {
  ctx.body = 'OK!';
  next();
});

export default router;
