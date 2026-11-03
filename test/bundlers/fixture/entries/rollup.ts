import startDispatchers from '../startDispatchers';

const componentLoaders = {
  AsyncBundlerComponent: () => import('../lazy-components/AsyncBundlerComponent')
};

startDispatchers(name => componentLoaders[name as keyof typeof componentLoaders]());
