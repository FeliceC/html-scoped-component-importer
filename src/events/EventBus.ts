import Logger from '../logger/Logger';

export type QueuedEvent = {
  eventName: string;
  payload: unknown;
  queuedAt: number;
};

type EventListener<Payload> = (payload: Payload) => void;
type QueueListener = (queuedEvents: QueuedEvent[]) => void;

export default class EventBus {
  private readonly listenersByEventName = new Map<string, Set<EventListener<unknown>>>();
  private readonly queueListeners = new Set<QueueListener>();
  private queue: QueuedEvent[] = [];
  private readonly maximumQueuedPerEvent: number;
  private readonly logger: Logger;

  /**
   * @param options.maximumQueuedPerEvent oldest queued event of a name is dropped beyond this limit
   * @param options.logger receives emit, queue and delivery activity
   */
  constructor(options: { maximumQueuedPerEvent?: number; logger?: Logger } = {}) {
    this.maximumQueuedPerEvent = options.maximumQueuedPerEvent ?? 50;
    this.logger = options.logger ?? new Logger({ scope: 'events' });
  }

  get queuedEvents(): QueuedEvent[] {
    return [...this.queue];
  }

  /** Subscribes to an event; the first subscriber of a name receives its queued events. */
  on<Payload = unknown>(eventName: string, listener: EventListener<Payload>): () => void {
    const listeners = this.listenersByEventName.get(eventName) ?? new Set();
    listeners.add(listener as EventListener<unknown>);
    this.listenersByEventName.set(eventName, listeners);
    this.deliverQueuedEvents(eventName, listener as EventListener<unknown>);
    return () => {
      listeners.delete(listener as EventListener<unknown>);
    };
  }

  /** Emits to current listeners, or queues the event when nobody is listening yet. */
  emit<Payload = unknown>(eventName: string, payload?: Payload): void {
    const listeners = this.listenersByEventName.get(eventName);
    if (!listeners?.size) {
      this.enqueue(eventName, payload);
      return;
    }
    this.logger.debug(`emit "${eventName}" → ${listeners.size} listener(s)`, payload);
    listeners.forEach(listener => this.callListener(eventName, listener, payload));
  }

  onQueueChange(listener: QueueListener): () => void {
    this.queueListeners.add(listener);
    return () => this.queueListeners.delete(listener);
  }

  private enqueue(eventName: string, payload: unknown): void {
    const sameNameEvents = this.queue.filter(queuedEvent => queuedEvent.eventName === eventName);
    if (sameNameEvents.length >= this.maximumQueuedPerEvent) {
      this.queue = this.queue.filter(queuedEvent => queuedEvent !== sameNameEvents[0]);
      this.logger.warn(`queue full for "${eventName}", dropped the oldest event`);
    }
    this.queue.push({ eventName, payload, queuedAt: Date.now() });
    this.logger.info(`queued "${eventName}" until someone listens`, payload);
    this.notifyQueueChange();
  }

  private deliverQueuedEvents(eventName: string, listener: EventListener<unknown>): void {
    const deliverableEvents = this.queue.filter(queuedEvent => queuedEvent.eventName === eventName);
    if (deliverableEvents.length === 0) return;

    this.queue = this.queue.filter(queuedEvent => queuedEvent.eventName !== eventName);
    this.logger.info(`delivering ${deliverableEvents.length} queued "${eventName}" event(s)`);
    this.notifyQueueChange();
    deliverableEvents.forEach(queuedEvent => this.callListener(eventName, listener, queuedEvent.payload));
  }

  private callListener(eventName: string, listener: EventListener<unknown>, payload: unknown): void {
    try {
      listener(payload);
    } catch (error) {
      this.logger.error(`listener of "${eventName}" threw`, error);
    }
  }

  private notifyQueueChange(): void {
    const snapshot = this.queuedEvents;
    this.queueListeners.forEach(listener => listener(snapshot));
  }
}
