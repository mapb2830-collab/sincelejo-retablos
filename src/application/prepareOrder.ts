import { missingRequiredFields, type CartSummary } from '../domain/cart';
import {
  buildOrderSnapshot,
  canTransition,
  createOrderReference,
  validateCustomer,
  type CustomerDetails,
  type CustomerErrors,
  type OrderSnapshot,
} from '../domain/order';
import { UNIT_LABEL, type SaleUnit } from '../domain/product';
import type { OrderChannel, OrderHistory } from '../ports';

export type PrepareOrderResult =
  | { ok: true; order: OrderSnapshot; message: string; link: string }
  | { ok: false; customerErrors: CustomerErrors; missing: ReturnType<typeof missingRequiredFields>; emptyCart: boolean };

/** Caso de uso: validar datos y preparar el pedido para enviarlo por el canal configurado. */
export function prepareOrder(
  summary: CartSummary,
  customer: CustomerDetails,
  channel: OrderChannel,
  opts: { reference?: string; now?: Date } = {},
): PrepareOrderResult {
  const customerErrors = validateCustomer(customer);
  const missing = missingRequiredFields(summary);
  const emptyCart = summary.lines.length === 0;
  if (emptyCart || missing.length > 0 || Object.keys(customerErrors).length > 0) {
    return { ok: false, customerErrors, missing, emptyCart };
  }
  const now = opts.now ?? new Date();
  const order = buildOrderSnapshot(summary, customer, (u) => UNIT_LABEL[u as SaleUnit], opts.reference ?? createOrderReference(now), now);
  return { ok: true, order, message: channel.buildMessage(order), link: channel.buildLink(order) };
}

/**
 * Caso de uso: el cliente abrió WhatsApp con el pedido. Solo se registra en su navegador.
 * No significa que el negocio lo haya recibido ni confirmado.
 */
export function markSentToBusiness(order: OrderSnapshot, history: OrderHistory): OrderSnapshot {
  const next = canTransition(order.status, 'enviado-al-negocio') ? { ...order, status: 'enviado-al-negocio' as const } : order;
  history.saveLast(next);
  return next;
}
