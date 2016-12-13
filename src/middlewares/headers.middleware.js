/**
 * @file
 * Middleware for setting values in the responseheader
 */

import {VERSION} from '../utils/version.util';

/**
 * Sets the version of the API in the header on theresponses
 *
 * @param {object} ctx
 * @param {function} next
 */
export async function SetVersionHeader(ctx, next) {
  await next();
  ctx.set('X-API-Version', VERSION);
}
