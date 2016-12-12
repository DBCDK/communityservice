/**
 * For testing purposes
 *
 * @param ctx
 * @param next
 * @returns {*}
 */
export default async function ctxdump(ctx, next) {
  const body = ctx.body ? ctx.body : '';
  ctx.body = body + preDump(ctx.session, 'session') + preDump(ctx, 'ctx');   // For test
  await next();
}

function preDump(obj, txt) {
  return '<div><h3>' + txt + '</h3><pre id="dump-' + txt + '">' + JSON.stringify(obj, null, 2) + '</pre></div>';
}
