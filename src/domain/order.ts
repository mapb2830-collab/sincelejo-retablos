import { sanitizeText, type CartSummary } from './cart';

/**
 * Estados del pedido. Solo "carrito-preparado" y "enviado-al-negocio" se registran
 * en esta primera fase (en el navegador del cliente). La confirmación del negocio y el
 * pago confirmado requieren el backend de la fase 2: el frontend nunca los marca por sí solo.
 */
export type OrderStatus = 'carrito-preparado' | 'enviado-al-negocio' | 'confirmado-por-negocio' | 'pago-confirmado' | 'cancelado';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  'carrito-preparado': 'Carrito preparado',
  'enviado-al-negocio': 'Pedido enviado al negocio',
  'confirmado-por-negocio': 'Pedido confirmado por el negocio',
  'pago-confirmado': 'Pago confirmado',
  cancelado: 'Cancelado',
};

export const ORDER_FLOW: OrderStatus[] = ['carrito-preparado', 'enviado-al-negocio', 'confirmado-por-negocio', 'pago-confirmado'];

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'carrito-preparado': ['enviado-al-negocio', 'cancelado'],
  'enviado-al-negocio': ['confirmado-por-negocio', 'cancelado'],
  'confirmado-por-negocio': ['pago-confirmado', 'cancelado'],
  'pago-confirmado': [],
  cancelado: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export type DeliveryMethod = 'domicilio' | 'acordar';
export type PaymentPreference = 'transferencia' | 'efectivo' | 'por-definir';

export interface CustomerDetails {
  name: string;
  phone: string;
  delivery: DeliveryMethod;
  city: string;
  address: string;
  payment: PaymentPreference;
  notes: string;
}

export const EMPTY_CUSTOMER: CustomerDetails = {
  name: '',
  phone: '',
  delivery: 'acordar',
  city: '',
  address: '',
  payment: 'por-definir',
  notes: '',
};

export type CustomerErrors = Partial<Record<keyof CustomerDetails, string>>;

export function normalizeCustomer(c: CustomerDetails): CustomerDetails {
  return {
    name: sanitizeText(c.name, 60).replace(/\s+/g, ' '),
    phone: sanitizeText(c.phone, 20).replace(/[^\d+ ]/g, ''),
    delivery: c.delivery === 'domicilio' ? 'domicilio' : 'acordar',
    city: sanitizeText(c.city, 60),
    address: sanitizeText(c.address, 120),
    payment: (['transferencia', 'efectivo', 'por-definir'] as const).includes(c.payment) ? c.payment : 'por-definir',
    notes: sanitizeText(c.notes, 400),
  };
}

/** Teléfono opcional: si se escribe, debe ser un celular colombiano de 10 dígitos (con o sin +57). */
export function isValidColombianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('57') ? digits.slice(2) : digits;
  return /^3\d{9}$/.test(local) || /^60\d{8}$/.test(local);
}

export function validateCustomer(input: CustomerDetails): CustomerErrors {
  const c = normalizeCustomer(input);
  const errors: CustomerErrors = {};
  if (c.name.length < 2) errors.name = 'Escribe tu nombre (mínimo 2 caracteres).';
  if (c.phone && !isValidColombianPhone(c.phone)) errors.phone = 'Escribe un número de 10 dígitos, por ejemplo 300 123 4567.';
  if (c.delivery === 'domicilio') {
    if (c.city.length < 2) errors.city = 'Indica la ciudad o municipio de entrega.';
    if (c.address.length < 4) errors.address = 'Indica la dirección o el barrio de entrega.';
  }
  return errors;
}

/** Referencia legible para identificar el pedido en la conversación (no es un número de factura). */
export function createOrderReference(now: Date = new Date(), random: () => number = Math.random): string {
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += alphabet[Math.floor(random() * alphabet.length)];
  return `SR-${y}${m}${d}-${suffix}`;
}

export interface OrderLineSnapshot {
  name: string;
  variant: string;
  unit: string;
  quantity: number;
  unitPrice: number | null;
  subtotal: number | null;
  instructions: string;
  phoneModel: string;
  referenceImageName: string;
}

export interface OrderSnapshot {
  reference: string;
  createdAt: string;
  status: OrderStatus;
  customer: CustomerDetails;
  lines: OrderLineSnapshot[];
  productsTotal: number;
  hasQuoteItems: boolean;
  /** En la fase 1 el envío siempre se cotiza aparte. */
  shipping: 'pendiente-de-cotizacion';
}

export function buildOrderSnapshot(
  summary: CartSummary,
  customer: CustomerDetails,
  unitLabel: (unit: string) => string,
  reference: string,
  now: Date = new Date(),
): OrderSnapshot {
  if (summary.lines.length === 0) throw new Error('El carrito está vacío');
  return {
    reference,
    createdAt: now.toISOString(),
    status: 'carrito-preparado',
    customer: normalizeCustomer(customer),
    lines: summary.lines.map((l) => ({
      name: l.product.name,
      variant: l.variant.label,
      unit: unitLabel(l.variant.unit),
      quantity: l.line.quantity,
      unitPrice: l.unitPrice,
      subtotal: l.subtotal,
      instructions: l.line.customization.instructions,
      phoneModel: l.line.customization.phoneModel,
      referenceImageName: l.line.customization.referenceImageName,
    })),
    productsTotal: summary.productsTotal,
    hasQuoteItems: summary.hasQuoteItems,
    shipping: 'pendiente-de-cotizacion',
  };
}
