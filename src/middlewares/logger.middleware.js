import {log} from '../utils/logging.util';

export async function LoggerMiddleware(ctx, next) {
  await next();
  try {
    log.info('page request', {
      request: {
        method: ctx.request.method,
        url: ctx.request.url,
        header: ctx.request.header
      },
      response: {
        status: ctx.response.status,
        message: ctx.response.message
      }
    });
  }
  catch (e) {
    log.error('parsing of ctx object failed', {error: e, ctx: ctx});
  }
}
