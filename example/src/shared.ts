import { EventBus, Logger, SharedState } from '../../src/index';

export type Product = { id: number; name: string; price: number };

export const logger = new Logger({ scope: 'demo', enabled: true });

export const events = new EventBus({ logger: logger.withScope('events') });

export const cartState = new SharedState({ items: [] as Product[] }, { logger: logger.withScope('state:cart') });
