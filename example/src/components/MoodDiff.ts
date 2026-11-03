import { moodState } from '../shared';

export default class MoodDiff {
  private readonly unsubscribe: () => void;

  constructor(element: HTMLElement) {
    element.textContent = `mood: ${moodState.get().mood}`;
    this.unsubscribe = moodState.subscribe((nextState, previousState) => {
      element.textContent = `${previousState.mood} → ${nextState.mood}`;
    });
  }

  _destroy() {
    this.unsubscribe();
  }
}
