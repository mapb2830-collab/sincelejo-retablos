import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { services } from '../../application/services';
import { catalog } from '../../catalog';
import {
  addItem,
  clearCart,
  removeLine,
  restoreCart,
  summarize,
  updateCustomization,
  updateQuantity,
  type Cart,
  type CartSummary,
  type Customization,
} from '../../domain/cart';

type Action =
  | { type: 'add'; productId: string; variantId: string; quantity: number; customization?: Partial<Customization> }
  | { type: 'qty'; lineId: string; quantity: number }
  | { type: 'custom'; lineId: string; customization: Partial<Customization> }
  | { type: 'remove'; lineId: string }
  | { type: 'clear' };

function reducer(cart: Cart, action: Action): Cart {
  switch (action.type) {
    case 'add':
      return addItem(cart, catalog, action);
    case 'qty':
      return updateQuantity(cart, action.lineId, action.quantity);
    case 'custom':
      return updateCustomization(cart, action.lineId, action.customization);
    case 'remove':
      return removeLine(cart, action.lineId);
    case 'clear':
      return clearCart();
  }
}

interface CartApi {
  cart: Cart;
  summary: CartSummary;
  add: (productId: string, variantId: string, quantity: number, customization?: Partial<Customization>) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  setCustomization: (lineId: string, customization: Partial<Customization>) => void;
  remove: (lineId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(reducer, undefined, () => restoreCart(services.cartRepository.load(), catalog));

  useEffect(() => {
    services.cartRepository.save(cart);
  }, [cart]);

  const add = useCallback<CartApi['add']>(
    (productId, variantId, quantity, customization) => dispatch({ type: 'add', productId, variantId, quantity, customization }),
    [],
  );
  const setQuantity = useCallback((lineId: string, quantity: number) => dispatch({ type: 'qty', lineId, quantity }), []);
  const setCustomization = useCallback(
    (lineId: string, customization: Partial<Customization>) => dispatch({ type: 'custom', lineId, customization }),
    [],
  );
  const remove = useCallback((lineId: string) => dispatch({ type: 'remove', lineId }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo<CartApi>(
    () => ({ cart, summary: summarize(cart, catalog), add, setQuantity, setCustomization, remove, clear }),
    [cart, add, setQuantity, setCustomization, remove, clear],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
