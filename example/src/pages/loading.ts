import Clock from '../registry/Clock';
import { setupPage } from '../layout/setupPage';

const { syncDispatcher } = setupPage();

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

const scopedBox = document.getElementById('scoped-box')!;
document.getElementById('inject-clocks')!.addEventListener('click', () => {
  scopedBox.innerHTML = '<span class="clock" data-sync-component="Clock"></span>'.repeat(2);
  syncDispatcher.importComponents({ Clock }, scopedBox);
});
