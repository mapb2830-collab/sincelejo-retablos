/**
 * Modelo de pagos para la fase 2. En esta entrega NO hay pasarela activa.
 * El estado de un pago solo puede cambiar desde el servidor, tras verificar la
 * respuesta o el webhook firmado del proveedor; el navegador nunca lo decide.
 */
export type PaymentStatus = 'no-iniciado' | 'pendiente' | 'aprobado' | 'rechazado' | 'anulado' | 'error';

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  'no-iniciado': 'Pago no iniciado',
  pendiente: 'Pago pendiente',
  aprobado: 'Pago aprobado',
  rechazado: 'Pago rechazado',
  anulado: 'Pago anulado',
  error: 'Error en el pago',
};

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  'no-iniciado': ['pendiente', 'error'],
  pendiente: ['aprobado', 'rechazado', 'anulado', 'error'],
  // Un pago aprobado solo puede anularse (reverso); nunca vuelve a pendiente.
  aprobado: ['anulado'],
  rechazado: ['pendiente'],
  anulado: [],
  error: ['pendiente'],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[from].includes(to);
}

export interface PaymentRecord {
  orderReference: string;
  provider: 'wompi' | 'mercadopago' | 'ninguno';
  /** Identificador de la transacción asignado por el proveedor. */
  transactionId: string | null;
  /** Monto en centavos calculado en el servidor desde el catálogo, nunca enviado por el navegador. */
  amountInCents: number;
  currency: 'COP';
  status: PaymentStatus;
  updatedAt: string;
}
