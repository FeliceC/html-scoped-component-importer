import { describe, it, expect, vi } from 'vitest';
import SharedState from '../../src/state/SharedState';
import Logger from '../../src/logger/Logger';

const createCartState = () =>
  new SharedState({ items: [] as string[], isOpen: false }, { logger: new Logger({ enabled: false }) });

describe('SharedState', () => {
  it('returns the initial state', () => {
    expect(createCartState().get()).toEqual({ items: [], isOpen: false });
  });

  it('shallow-merges partial updates', () => {
    const cartState = createCartState();
    cartState.set({ isOpen: true });

    expect(cartState.get()).toEqual({ items: [], isOpen: true });
  });

  it('accepts an updater function receiving the current state', () => {
    const cartState = createCartState();
    cartState.set(currentState => ({ items: [...currentState.items, 'book'] }));
    cartState.set(currentState => ({ items: [...currentState.items, 'pen'] }));

    expect(cartState.get().items).toEqual(['book', 'pen']);
  });

  it('notifies subscribers with next and previous state', () => {
    const cartState = createCartState();
    const listener = vi.fn();
    cartState.subscribe(listener);

    cartState.set({ isOpen: true });

    expect(listener).toHaveBeenCalledWith({ items: [], isOpen: true }, { items: [], isOpen: false });
  });

  it('stops notifying after unsubscribe', () => {
    const cartState = createCartState();
    const listener = vi.fn();
    cartState.subscribe(listener)();

    cartState.set({ isOpen: true });

    expect(listener).not.toHaveBeenCalled();
  });

  it('exposes a frozen state', () => {
    expect(Object.isFrozen(createCartState().get())).toBe(true);
  });

  it('keeps notifying other subscribers when one throws', () => {
    const cartState = createCartState();
    const healthyListener = vi.fn();
    cartState.subscribe(() => {
      throw new Error('broken subscriber');
    });
    cartState.subscribe(healthyListener);

    cartState.set({ isOpen: true });

    expect(healthyListener).toHaveBeenCalled();
  });
});
