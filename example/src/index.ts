import { ComponentDispatcher } from "../../src/index";

const compDispatcher = new ComponentDispatcher();

compDispatcher.createAsyncComponents().then(() => {
  compDispatcher.observeDomChanges();
});
