import { ORDER_FLOW, type OrderSnapshot } from '../../domain/order';
import type { OrderHistory } from '../../ports';
import { readJSON, remove, writeJSON } from './safeStorage';

const KEY = 'sr.lastOrder.v1';

const isStr = (v: unknown): v is string => typeof v === 'string';
const isMoney = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isMoneyOrNull = (v: unknown) => v === null || isMoney(v);

/** Valida un pedido leído de localStorage (puede estar manipulado o venir de una versión anterior). */
export function isValidOrderSnapshot(data: unknown): data is OrderSnapshot {
  if (!data || typeof data !== 'object') return false;
  const o = data as Record<string, unknown>;
  if (!isStr(o.reference) || o.reference.length > 40) return false;
  if (!isStr(o.createdAt) || Number.isNaN(Date.parse(o.createdAt))) return false;
  if (!isStr(o.status) || !(ORDER_FLOW as string[]).includes(o.status)) return false;
  if (!isMoney(o.productsTotal) || typeof o.hasQuoteItems !== 'boolean') return false;
  if (o.whatsappOpenedAt !== undefined && (!isStr(o.whatsappOpenedAt) || Number.isNaN(Date.parse(o.whatsappOpenedAt)))) return false;
  const c = o.customer as Record<string, unknown> | undefined;
  if (!c || typeof c !== 'object') return false;
  if (!['name', 'phone', 'city', 'address', 'notes'].every((k) => isStr(c[k]))) return false;
  if (!['domicilio', 'acordar'].includes(c.delivery as string)) return false;
  if (!['transferencia', 'efectivo', 'por-definir'].includes(c.payment as string)) return false;
  if (!Array.isArray(o.lines) || o.lines.length === 0 || o.lines.length > 100) return false;
  return o.lines.every((l: unknown) => {
    if (!l || typeof l !== 'object') return false;
    const x = l as Record<string, unknown>;
    return (
      ['name', 'variant', 'unit', 'instructions', 'phoneModel', 'referenceImageName'].every((k) => isStr(x[k])) &&
      Number.isInteger(x.quantity) && (x.quantity as number) >= 1 && (x.quantity as number) <= 999 &&
      isMoneyOrNull(x.unitPrice) && isMoneyOrNull(x.subtotal)
    );
  });
}

/** Guarda solo el último pedido preparado, en el navegador del cliente (no se envía a ningún servidor). */
export function createLocalOrderHistory(): OrderHistory {
  return {
    saveLast(order) {
      writeJSON(KEY, order);
    },
    loadLast() {
      const data = readJSON(KEY);
      if (data === null) return null;
      if (!isValidOrderSnapshot(data)) {
        remove(KEY);
        return null;
      }
      return data;
    },
    clear() {
      remove(KEY);
    },
  };
}
