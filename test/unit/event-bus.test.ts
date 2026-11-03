import { describe, it, expect, vi } from 'vitest';
import EventBus, { type QueuedEvent } from '../../src/events/EventBus';
import Logger from '../../src/logger/Logger';

const createEventBus = (maximumQueuedPerEvent?: number) =>
  new EventBus({ maximumQueuedPerEvent, logger: new Logger({ enabled: false }) });

describe('EventBus', () => {
  it('delivers payloads to every listener of an event', () => {
    const eventBus = createEventBus();
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    eventBus.on('cart:add', firstListener);
    eventBus.on('cart:add', secondListener);

    eventBus.emit('cart:add', { id: 3 });

    expect(firstListener).toHaveBeenCalledWith({ id: 3 });
    expect(secondListener).toHaveBeenCalledWith({ id: 3 });
  });

  it('stops delivering after unsubscribe', () => {
    const eventBus = createEventBus();
    const listener = vi.fn();
    eventBus.on('cart:add', listener)();
    eventBus.on('other', () => {});

    eventBus.emit('cart:add', 1);

    expect(listener).not.toHaveBeenCalled();
  });

  it('queues events emitted without listeners and replays them in order to the first subscriber', () => {
    const eventBus = createEventBus();
    eventBus.emit('cart:add', 1);
    eventBus.emit('cart:add', 2);
    expect(eventBus.queuedEvents.map(queuedEvent => queuedEvent.payload)).toEqual([1, 2]);

    const listener = vi.fn();
    eventBus.on('cart:add', listener);

    expect(listener.mock.calls).toEqual([[1], [2]]);
    expect(eventBus.queuedEvents).toEqual([]);
  });

  it('keeps queued events of other names when one name is delivered', () => {
    const eventBus = createEventBus();
    eventBus.emit('cart:add', 1);
    eventBus.emit('user:login', 'ada');

    eventBus.on('cart:add', () => {});

    expect(eventBus.queuedEvents).toEqual([expect.objectContaining({ eventName: 'user:login', payload: 'ada' })]);
  });

  it('drops the oldest event of a name beyond the queue limit', () => {
    const eventBus = createEventBus(2);
    eventBus.emit('tick', 1);
    eventBus.emit('tick', 2);
    eventBus.emit('tick', 3);

    expect(eventBus.queuedEvents.map(queuedEvent => queuedEvent.payload)).toEqual([2, 3]);
  });

  it('notifies queue listeners with a snapshot on enqueue and delivery', () => {
    const eventBus = createEventBus();
    const snapshots: QueuedEvent[][] = [];
    eventBus.onQueueChange(queuedEvents => snapshots.push(queuedEvents));

    eventBus.emit('cart:add', 1);
    eventBus.on('cart:add', () => {});

    expect(snapshots.map(snapshot => snapshot.length)).toEqual([1, 0]);
  });

  it('keeps notifying other listeners when one throws', () => {
    const eventBus = createEventBus();
    const healthyListener = vi.fn();
    eventBus.on('cart:add', () => {
      throw new Error('broken listener');
    });
    eventBus.on('cart:add', healthyListener);

    eventBus.emit('cart:add', 1);

    expect(healthyListener).toHaveBeenCalledWith(1);
  });
});
