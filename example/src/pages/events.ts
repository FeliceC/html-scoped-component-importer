import { EventBus } from '../../../src/index';
import { renderQueue, setupPage } from '../layout/setupPage';
import { events, logger } from '../shared';

const ACCENT_COLOURS = ['#ff5fa2', '#7c5cff', '#19c39a', '#ffb020', '#2fa6ff', '#ff7a45'];

const queueList = document.getElementById('queue-list')!;
const queueCounter = document.getElementById('queue-count')!;
events.onQueueChange(queuedEvents => renderQueue(queueList, queuedEvents, queueCounter));
renderQueue(queueList, events.queuedEvents, queueCounter);

setupPage();

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

let accentIndex = 0;
document.getElementById('broadcast-accent')!.addEventListener('click', () => {
  accentIndex = (accentIndex + 1) % ACCENT_COLOURS.length;
  events.emit('theme:accent', ACCENT_COLOURS[accentIndex]);
});

const smallBus = new EventBus({ maximumQueuedPerEvent: 3, logger: logger.withScope('🧺 small bus') });
const limitedQueue = document.getElementById('limited-queue')!;
smallBus.onQueueChange(queuedEvents => renderQueue(limitedQueue, queuedEvents));
renderQueue(limitedQueue, smallBus.queuedEvents);
let tickCount = 0;
document.getElementById('emit-tick')!.addEventListener('click', () => {
  smallBus.emit('tick', `tick #${++tickCount}`);
});
