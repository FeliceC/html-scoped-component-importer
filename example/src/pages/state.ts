import { highlightJson, setupPage } from '../layout/setupPage';
import { cartState, moodState, type Mood } from '../shared';

setupPage();

const stateInspector = document.getElementById('state-inspector')!;
highlightJson(stateInspector, cartState.get());
cartState.subscribe(nextState => highlightJson(stateInspector, nextState));

document.getElementById('clear-cart')!.addEventListener('click', () => cartState.set({ items: [] }));

document.querySelectorAll<HTMLButtonElement>('[data-mood]').forEach(button => {
  button.addEventListener('click', () => moodState.set({ mood: button.dataset.mood as Mood }));
});
