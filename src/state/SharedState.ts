import Logger from '../logger/Logger';

type StateListener<State> = (nextState: Readonly<State>, previousState: Readonly<State>) => void;
type StateUpdate<State> = Partial<State> | ((currentState: Readonly<State>) => Partial<State>);

export default class SharedState<State extends object> {
  private state: Readonly<State>;
  private readonly listeners = new Set<StateListener<State>>();
  private readonly logger: Logger;

  /** @param options.logger receives every state change */
  constructor(initialState: State, options: { logger?: Logger } = {}) {
    this.state = Object.freeze({ ...initialState });
    this.logger = options.logger ?? new Logger({ scope: 'state' });
  }

  get(): Readonly<State> {
    return this.state;
  }

  /** Shallow-merges the update and notifies subscribers with the next and previous state. */
  set(update: StateUpdate<State>): void {
    const previousState = this.state;
    const partialState = typeof update === 'function' ? update(previousState) : update;
    this.state = Object.freeze({ ...previousState, ...partialState });
    this.logger.debug('state changed', partialState);
    this.listeners.forEach(listener => {
      try {
        listener(this.state, previousState);
      } catch (error) {
        this.logger.error('state subscriber threw', error);
      }
    });
  }

  subscribe(listener: StateListener<State>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
