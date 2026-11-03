import { cartState, events, type Product } from '../shared';

const PRODUCTS: Product[] = [
  { id: 1, name: 'Notebook', price: 12 },
  { id: 2, name: 'Fountain pen', price: 34 },
  { id: 3, name: 'Desk lamp', price: 49 }
];

export default class ProductList {
  constructor(element: HTMLElement) {
    element.replaceChildren(...PRODUCTS.map(product => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${product.name} · €${product.price}`;
      button.addEventListener('click', () => {
        cartState.set(currentState => ({ items: [...currentState.items, product] }));
        events.emit('notify', `${product.name} added to the cart`);
      });
      return button;
    }));
  }
}
