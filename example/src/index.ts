import { ComponentDispatcher, type LogEntry, type QueuedEvent } from '../../src/index';
import Clock from './registry/Clock';
import { cartState, events, logger } from './shared';
import highlighter from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';

const MAXIMUM_LOG_ENTRIES = 60;

const QUEUE_DELIVERY_ANIMATION_MILLISECONDS = 450;

function renderLogEntry(entry: LogEntry): void {
  const logList = document.getElementById('log-list')!;
  const item = document.createElement('li');
  item.className = `log-entry log-entry--${entry.level}`;
  const time = document.createElement('time');
  time.textContent = new Date(entry.timestamp).toLocaleTimeString();
  const scope = document.createElement('span');
  scope.className = 'log-entry__scope';
  scope.textContent = entry.scope;
  const message = document.createElement('span');
  message.className = 'log-entry__message';
  message.textContent = entry.message;
  item.append(time, scope, message);
  logList.prepend(item);
  while (logList.children.length > MAXIMUM_LOG_ENTRIES) logList.lastElementChild!.remove();
}

function createQueueChip(queuedEvent: QueuedEvent): HTMLLIElement {
  const chip = document.createElement('li');
  chip.className = 'queue-chip';
  chip.dataset.queuedAt = String(queuedEvent.queuedAt);
  const eventName = document.createElement('code');
  eventName.textContent = queuedEvent.eventName;
  const payload = document.createElement('span');
  payload.textContent = String(queuedEvent.payload);
  chip.append(eventName, payload);
  return chip;
}

function renderQueue(queuedEvents: QueuedEvent[]): void {
  const queueList = document.getElementById('queue-list')!;
  document.getElementById('queue-count')!.textContent = String(queuedEvents.length);
  const queuedTimestamps = new Set(queuedEvents.map(queuedEvent => String(queuedEvent.queuedAt)));
  const deliveredChips = [...queueList.querySelectorAll<HTMLElement>('.queue-chip')]
    .filter(chip => !queuedTimestamps.has(chip.dataset.queuedAt!));
  deliveredChips.forEach(chip => chip.classList.add('is-delivered'));

  const showQueue = () => {
    if (queuedEvents.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'queue-empty';
      emptyItem.textContent = '✨ Empty: every event found a listener';
      queueList.replaceChildren(emptyItem);
      return;
    }
    queueList.replaceChildren(...queuedEvents.map(createQueueChip));
  };
  if (deliveredChips.length > 0) window.setTimeout(showQueue, QUEUE_DELIVERY_ANIMATION_MILLISECONDS);
  else showQueue();
}

function bindDemoControls(): void {
  const liveArea = document.getElementById('live-area')!;
  document.getElementById('add-card')!.addEventListener('click', () => {
    const card = document.createElement('div');
    card.dataset.component = 'LiveCard';
    card.className = 'live-card';
    liveArea.append(card);
  });
  document.getElementById('remove-card')!.addEventListener('click', () => {
    liveArea.lastElementChild?.remove();
  });

  const listenerToggle = document.getElementById('listener-toggle') as HTMLButtonElement;
  const listenerStatus = document.getElementById('listener-status')!;
  const notificationSlot = document.getElementById('notification-slot')!;
  listenerToggle.addEventListener('click', () => {
    const isConnected = notificationSlot.childElementCount > 0;
    if (isConnected) {
      notificationSlot.replaceChildren();
    } else {
      const notificationCenter = document.createElement('div');
      notificationCenter.dataset.component = 'NotificationCenter';
      notificationCenter.className = 'notifications';
      notificationSlot.replaceChildren(notificationCenter);
    }
    listenerToggle.textContent = isConnected ? '🔌 Connect listener' : '✂️ Disconnect listener';
    listenerStatus.textContent = isConnected ? 'offline' : 'listening';
    listenerStatus.dataset.connected = String(!isConnected);
  });

  document.getElementById('clear-cart')!.addEventListener('click', () => cartState.set({ items: [] }));
}

function renderStateInspector(): void {
  const inspector = document.getElementById('state-inspector')!;
  inspector.textContent = JSON.stringify(cartState.get(), null, 2);
  inspector.removeAttribute('data-highlighted');
  highlighter.highlightElement(inspector);
}

logger.onEntry(renderLogEntry);
events.onQueueChange(renderQueue);
renderQueue(events.queuedEvents);
bindDemoControls();

highlighter.registerLanguage('typescript', typescript);
highlighter.registerLanguage('html', xml);
highlighter.registerLanguage('json', json);
highlighter.highlightAll();
renderStateInspector();
cartState.subscribe(renderStateInspector);

const asyncDispatcher = new ComponentDispatcher({ events, logger: logger.withScope('⚡ dispatcher') });
asyncDispatcher.importAsyncComponents().then(() => asyncDispatcher.observeDomChanges());

const syncDispatcher = new ComponentDispatcher({ events, logger: logger.withScope('📦 dispatcher') });
syncDispatcher.Selector = '[data-sync-component]';
syncDispatcher.importComponents({ Clock });
