import type { OrderSnapshot } from '../../domain/order';
import type { OrderHistory } from '../../ports';
import { readJSON, remove, writeJSON } from './safeStorage';

const KEY = 'sr.lastOrder.v1';

/** Guarda solo el último pedido preparado, en el navegador del cliente (no se envía a ningún servidor). */
export function createLocalOrderHistory(): OrderHistory {
  return {
    saveLast(order) {
      writeJSON(KEY, order);
    },
    loadLast() {
      const data = readJSON(KEY) as OrderSnapshot | null;
      if (!data || typeof data.reference !== 'string' || !Array.isArray(data.lines)) return null;
      return data;
    },
    clear() {
      remove(KEY);
    },
  };
}
