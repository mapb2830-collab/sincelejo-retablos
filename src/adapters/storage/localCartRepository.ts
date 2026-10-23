import type { Cart } from '../../domain/cart';
import type { CartRepository } from '../../ports';
import { readJSON, writeJSON } from './safeStorage';

const KEY = 'sr.cart.v1';
/** El carrito se conserva temporalmente: 7 días desde el último cambio. */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function createLocalCartRepository(now: () => number = Date.now): CartRepository {
  return {
    storageKey: KEY,
    load() {
      const data = readJSON(KEY) as { savedAt?: number; cart?: unknown } | null;
      if (!data || typeof data.savedAt !== 'number' || now() - data.savedAt > TTL_MS) return null;
      return data.cart;
    },
    save(cart: Cart) {
      writeJSON(KEY, { savedAt: now(), cart });
    },
  };
}
