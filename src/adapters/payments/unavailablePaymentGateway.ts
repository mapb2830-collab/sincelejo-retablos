import type { PaymentGateway } from '../../ports';

/** Adaptador de la fase 1: no hay pagos en línea. Cualquier intento falla de forma explícita. */
export const unavailablePaymentGateway: PaymentGateway = {
  available: false,
  async startCheckout() {
    throw new Error('Los pagos en línea todavía no están habilitados. Coordina el pago por WhatsApp.');
  },
  async getStatus() {
    return 'no-iniciado';
  },
};
