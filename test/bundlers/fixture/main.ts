import { ComponentDispatcher } from '../../../lib/index.js';
import BundlerTestComponent from './components/BundlerTestComponent';
import FailingBundlerComponent from './components/FailingBundlerComponent';

const dispatcher = new ComponentDispatcher();
dispatcher.importComponents({ BundlerTestComponent, FailingBundlerComponent });
