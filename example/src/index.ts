import { ComponentDispatcher, type LogEntry, type QueuedEvent } from '../../src/index';
import Clock from './registry/Clock';
import { events, logger } from './shared';

const MAXIMUM_LOG_ENTRIES = 60;

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
  message.textContent = entry.message;
  item.append(time, scope, message);
  logList.prepend(item);
  while (logList.children.length > MAXIMUM_LOG_ENTRIES) logList.lastElementChild!.remove();
}

function renderQueue(queuedEvents: QueuedEvent[]): void {
  const queueList = document.getElementById('queue-list')!;
  document.getElementById('queue-count')!.textContent = String(queuedEvents.length);
  if (queuedEvents.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'queue-empty';
    emptyItem.textContent = 'Empty — every event found a listener.';
    queueList.replaceChildren(emptyItem);
    return;
  }
  queueList.replaceChildren(...queuedEvents.map(queuedEvent => {
    const item = document.createElement('li');
    item.className = 'queue-item';
    const eventName = document.createElement('code');
    eventName.textContent = queuedEvent.eventName;
    const payload = document.createElement('span');
    payload.textContent = JSON.stringify(queuedEvent.payload);
    item.append(eventName, payload);
    return item;
  }));
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

  const mountButton = document.getElementById('mount-notifications') as HTMLButtonElement;
  mountButton.addEventListener('click', () => {
    const notificationCenter = document.createElement('div');
    notificationCenter.dataset.component = 'NotificationCenter';
    notificationCenter.className = 'notifications';
    document.getElementById('notification-slot')!.replaceChildren(notificationCenter);
    mountButton.disabled = true;
  });
}

logger.onEntry(renderLogEntry);
events.onQueueChange(renderQueue);
renderQueue(events.queuedEvents);
bindDemoControls();

const asyncDispatcher = new ComponentDispatcher({ events, logger: logger.withScope('async') });
asyncDispatcher.importAsyncComponents().then(() => asyncDispatcher.observeDomChanges());

const syncDispatcher = new ComponentDispatcher({ events, logger: logger.withScope('sync') });
syncDispatcher.Selector = '[data-sync-component]';
syncDispatcher.importComponents({ Clock });
