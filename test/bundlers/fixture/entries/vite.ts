import startDispatchers from '../startDispatchers';
import type { ComponentLoader } from '../../../../lib/index.js';

const componentModules = import.meta.glob<Awaited<ReturnType<ComponentLoader>>>('../lazy-components/*.ts');

startDispatchers(name => componentModules[`../lazy-components/${name}.ts`]());
