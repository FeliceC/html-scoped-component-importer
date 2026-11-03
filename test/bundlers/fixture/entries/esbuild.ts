import startDispatchers from '../startDispatchers';

startDispatchers(name => import(`../lazy-components/${name}.ts`));
