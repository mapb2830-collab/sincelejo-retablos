import { PAYMENT_STATUS_LABEL, type PaymentStatus } from '../../domain/payment';

const PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[];
import type { PaymentGateway } from '../../ports';

/**
 * Adaptador PREPARADO (no activo) para la fase 2: habla con un backend propio
 * (no con Wompi/Mercado Pago directamente). Ver docs/PAGOS.md para el contrato.
 * Solo se envían identificadores y cantidades; nunca precios ni totales.
 */
export function createHttpPaymentGateway(apiBaseUrl: string, fetchImpl: typeof fetch = fetch): PaymentGateway {
  const base = apiBaseUrl.replace(/\/+$/, '');
  return {
    available: true,
    async startCheckout({ orderReference, lines }) {
      const res = await fetchImpl(`${base}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderReference,
          lines: lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
        }),
      });
      if (!res.ok) throw new Error(`No se pudo iniciar el pago (${res.status}).`);
      const data = (await res.json()) as { redirectUrl?: unknown; orderReference?: unknown };
      if (typeof data.redirectUrl !== 'string' || !/^https:\/\//.test(data.redirectUrl)) {
        throw new Error('Respuesta inválida del servidor de pagos.');
      }
      return { redirectUrl: data.redirectUrl, orderReference: String(data.orderReference ?? orderReference) };
    },
    async getStatus(orderReference) {
      const res = await fetchImpl(`${base}/orders/${encodeURIComponent(orderReference)}/payment`);
      if (!res.ok) return 'error';
      const data = (await res.json()) as { status?: unknown };
      return PAYMENT_STATUSES.includes(data.status as PaymentStatus) ? (data.status as PaymentStatus) : 'error';
    },
  };
}
