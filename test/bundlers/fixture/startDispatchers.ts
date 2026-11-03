import { ComponentDispatcher, type ComponentLoader } from '../../../lib/index.js';
import BundlerTestComponent from './components/BundlerTestComponent';
import FailingBundlerComponent from './components/FailingBundlerComponent';

export default function startDispatchers(loadComponent: ComponentLoader): void {
  new ComponentDispatcher().importComponents({ BundlerTestComponent, FailingBundlerComponent });

  const asyncDispatcher = new ComponentDispatcher({ loadComponent });
  asyncDispatcher.Selector = '[data-async-component]';
  asyncDispatcher.importAsyncComponents();
}
