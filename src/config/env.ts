/** Configuración pública leída de variables VITE_*. Nunca contiene secretos. */
const DEFAULT_WHATSAPP = '573013804470';

function readWhatsAppNumber(raw: string | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  // Número colombiano internacional: 57 + 10 dígitos.
  return /^57\d{10}$/.test(digits) ? digits : DEFAULT_WHATSAPP;
}

export const env = {
  whatsappNumber: readWhatsAppNumber(import.meta.env.VITE_WHATSAPP_NUMBER),
  siteUrl: (import.meta.env.VITE_SITE_URL ?? '').trim(),
  paymentsEnabled: import.meta.env.VITE_PAYMENTS_ENABLED === 'true',
  ordersApiUrl: (import.meta.env.VITE_ORDERS_API_URL ?? '').trim(),
} as const;

export { readWhatsAppNumber };
