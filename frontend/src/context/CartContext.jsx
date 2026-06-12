import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem('forestroots_cart');
    return stored ? JSON.parse(stored) : [];
  });

  function save(next) {
    setItems(next);
    localStorage.setItem('forestroots_cart', JSON.stringify(next));
  }

  function addItem(product, quantity = 1) {
    const existing = items.find((item) => item.id === product.id);
    const next = existing
      ? items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
      : [...items, { ...product, quantity }];
    save(next);
  }

  function updateQuantity(id, quantity) {
    save(items.map((item) => item.id === id ? { ...item, quantity } : item).filter((item) => item.quantity > 0));
  }

  function clearCart() {
    save([]);
  }

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const value = useMemo(() => ({ items, total, addItem, updateQuantity, clearCart }), [items, total]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

