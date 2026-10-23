/**
 * Datos oficiales de la empresa (fuente: catálogo PDF).
 * Los campos en `null` no se conocen todavía: la interfaz los omite en lugar de inventarlos.
 */
export const business = {
  name: 'Sincelejo Retablos',
  neighborhood: 'Barrio El Recreo',
  city: 'Sincelejo',
  region: 'Sucre',
  country: 'Colombia',
  /** Teléfono de pedidos tal como lo publica el negocio. */
  phoneDisplay: '301 380 4470',
  phoneLocal: '3013804470',
  instagramHandle: 'sincelejo_retablos15',
  instagramUrl: 'https://www.instagram.com/sincelejo_retablos15/',
  paymentMethods: ['Transferencia', 'Efectivo'] as const,
  shippingNote: 'El costo del envío a domicilio depende del lugar de destino.',
  // Pendientes de confirmar por el negocio. Mientras sean null no se muestran.
  exactAddress: null as string | null,
  openingHours: null as string | null,
  email: null as string | null,
  productionTime: null as string | null,
} as const;
