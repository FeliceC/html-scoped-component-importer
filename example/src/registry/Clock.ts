export default class Clock {
  private readonly intervalIdentifier: number;

  constructor(element: HTMLElement) {
    const render = () => {
      element.textContent = new Date().toLocaleTimeString();
    };
    render();
    this.intervalIdentifier = window.setInterval(render, 1000);
  }

  _destroy() {
    window.clearInterval(this.intervalIdentifier);
  }
}
