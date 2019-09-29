import { ComponentDispatcher } from '../../src/index';

const compDispatcher = new ComponentDispatcher();

compDispatcher.createAsyncComponents(['ExampleComponent', 'ExampleComponent2']);