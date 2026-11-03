import { moodState, type Mood } from '../shared';

const TITLES: Record<Mood, string> = { happy: 'Feeling great today', sleepy: 'Need a coffee…', party: 'Party time!' };

export default class MoodTitle {
  private readonly unsubscribe: () => void;

  constructor(element: HTMLElement) {
    const render = () => {
      element.textContent = TITLES[moodState.get().mood];
    };
    render();
    this.unsubscribe = moodState.subscribe(render);
  }

  _destroy() {
    this.unsubscribe();
  }
}
