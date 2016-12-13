import combineRouters from 'koa-combine-routers';

// Routes
import rootRoutes from './root.routes';

const router = combineRouters([
  rootRoutes
]);

export default router;

