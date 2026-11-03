import { ComponentDispatcher, type LogEntry, type QueuedEvent } from '../../../src/index';
import highlighter from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import Clock from '../registry/Clock';
import { events, logger } from '../shared';

const MAXIMUM_LOG_ENTRIES = 60;
const QUEUE_DELIVERY_ANIMATION_MILLISECONDS = 450;

highlighter.registerLanguage('typescript', typescript);
highlighter.registerLanguage('html', xml);
highlighter.registerLanguage('json', json);

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
  message.append(...entry.message.split(/(https:\/\/\S+)/).map(part => {
    if (!part.startsWith('https://')) return part;
    const link = document.createElement('a');
    link.href = part;
    link.textContent = part.replace('https://', '');
    link.target = '_blank';
    link.rel = 'noopener';
    return link;
  }));
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

/** Draws a queue snapshot, letting delivered chips fly out before they disappear. */
export function renderQueue(queueList: HTMLElement, queuedEvents: QueuedEvent[], queueCounter?: HTMLElement): void {
  if (queueCounter) queueCounter.textContent = String(queuedEvents.length);
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

export function highlightJson(element: HTMLElement, value: unknown): void {
  element.textContent = JSON.stringify(value, null, 2);
  element.removeAttribute('data-highlighted');
  highlighter.highlightElement(element);
}

/** Wires the live log and code highlighting, then starts the async and sync dispatchers shared by every page. */
export function highlightAllCode(): void {
  highlighter.highlightAll();
}

export function setupPage(): { asyncDispatcher: ComponentDispatcher; syncDispatcher: ComponentDispatcher } {
  logger.onEntry(renderLogEntry);
  highlightAllCode();

  const asyncDispatcher = new ComponentDispatcher({ events, logger: logger.withScope('⚡ dispatcher') });
  asyncDispatcher.importAsyncComponents().then(() => asyncDispatcher.observeDomChanges());

  const syncDispatcher = new ComponentDispatcher({ events, logger: logger.withScope('📦 dispatcher') });
  syncDispatcher.Selector = '[data-sync-component]';
  syncDispatcher.importComponents({ Clock });

  return { asyncDispatcher, syncDispatcher };
}
