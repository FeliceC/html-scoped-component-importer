import { cartState } from '../shared';

export default class CartBadge {
  private readonly unsubscribe: () => void;

  constructor(element: HTMLElement) {
    const render = () => {
      const { items } = cartState.get();
      const total = items.reduce((sum, product) => sum + product.price, 0);
      element.textContent = `🛒 ${items.length} item(s) · €${total}`;
    };
    render();
    this.unsubscribe = cartState.subscribe(render);
  }

  _destroy() {
    this.unsubscribe();
  }
}
