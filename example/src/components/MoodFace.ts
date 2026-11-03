import { moodState, type Mood } from '../shared';

const FACES: Record<Mood, string> = { happy: '😀', sleepy: '😴', party: '🥳' };

export default class MoodFace {
  private readonly unsubscribe: () => void;

  constructor(element: HTMLElement) {
    const render = () => {
      element.textContent = FACES[moodState.get().mood];
    };
    render();
    this.unsubscribe = moodState.subscribe(render);
  }

  _destroy() {
    this.unsubscribe();
  }
}
