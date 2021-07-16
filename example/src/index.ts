import { ComponentDispatcher } from "../../src/index";

const compDispatcher = new ComponentDispatcher();

//Here it throws an error if no argument has passed
compDispatcher.createAsyncComponents('').then(() => {
  compDispatcher.observeDomChanges();
});
