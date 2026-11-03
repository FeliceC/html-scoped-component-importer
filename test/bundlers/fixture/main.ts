import { ComponentDispatcher } from '../../../src/index';
import BundlerTestComponent from 'COMPONENTS/BundlerTestComponent';
import FailingBundlerComponent from 'COMPONENTS/FailingBundlerComponent';

const dispatcher = new ComponentDispatcher();
dispatcher.importComponents({ BundlerTestComponent, FailingBundlerComponent });
