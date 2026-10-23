/** Puertos: contratos que el dominio y los casos de uso esperan del mundo exterior. */
import type { Cart, CartLine } from '../domain/cart';
import type { OrderSnapshot } from '../domain/order';
import type { PaymentStatus } from '../domain/payment';

export interface CartRepository {
  /** Devuelve datos sin validar; el dominio los sanea con restoreCart(). */
  load(): unknown;
  save(cart: Cart): void;
}

export interface OrderHistory {
  saveLast(order: OrderSnapshot): void;
  loadLast(): OrderSnapshot | null;
  clear(): void;
}

/** Canal por el que el cliente envía el pedido al negocio (fase 1: WhatsApp). */
export interface OrderChannel {
  buildMessage(order: OrderSnapshot): string;
  buildLink(order: OrderSnapshot): string;
}

export interface CheckoutSession {
  /** URL del proveedor o del backend a la que se redirige al cliente. */
  redirectUrl: string;
  orderReference: string;
}

/**
 * Pasarela de pagos (fase 2). El navegador solo envía identificadores y cantidades;
 * el servidor recalcula el total desde el catálogo y crea la transacción.
 */
export interface PaymentGateway {
  readonly available: boolean;
  startCheckout(input: { orderReference: string; lines: Pick<CartLine, 'productId' | 'variantId' | 'quantity'>[] }): Promise<CheckoutSession>;
  getStatus(orderReference: string): Promise<PaymentStatus>;
}
