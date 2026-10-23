import type { Product, Variant } from './product';

export const MIN_QTY = 1;
export const MAX_QTY = 999;
export const MAX_INSTRUCTIONS = 500;
export const MAX_PHONE_MODEL = 60;
export const MIN_PHONE_MODEL = 2;

/** Regla única para el modelo de celular (diálogo, carrito y validación del pedido). */
export function isValidPhoneModel(value: string): boolean {
  return value.trim().length >= MIN_PHONE_MODEL;
}

export interface Customization {
  instructions: string;
  phoneModel: string;
  /** Solo el nombre del archivo: la imagen no se sube a ningún servidor, se envía por WhatsApp. */
  referenceImageName: string;
}

export const EMPTY_CUSTOMIZATION: Customization = { instructions: '', phoneModel: '', referenceImageName: '' };

/** Una línea guarda identificadores, nunca precios: el precio siempre sale del catálogo. */
export interface CartLine {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  customization: Customization;
}

export interface Cart {
  lines: CartLine[];
}

export const EMPTY_CART: Cart = { lines: [] };

export interface CatalogLookup {
  find(productId: string, variantId: string): { product: Product; variant: Variant } | undefined;
}

export interface PricedLine {
  line: CartLine;
  product: Product;
  variant: Variant;
  unitPrice: number | null;
  subtotal: number | null;
}

export interface CartSummary {
  lines: PricedLine[];
  itemCount: number;
  /** Suma de las líneas con precio publicado. El envío NO se incluye. */
  productsTotal: number;
  hasQuoteItems: boolean;
}

export function clampQuantity(value: unknown): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return MIN_QTY;
  return Math.min(MAX_QTY, Math.max(MIN_QTY, Math.trunc(n)));
}

/** Texto de una sola línea: los saltos de línea se convierten en espacios. */
export function sanitizeLine(value: unknown, max: number): string {
  return sanitizeText(typeof value === 'string' ? value.replace(/[\r\n\u2028\u2029]+/g, ' ') : value, max).replace(/\s{2,}/g, ' ');
}

export function sanitizeText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // Elimina caracteres de control (excepto saltos de línea) y recorta.
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').trim().slice(0, max);
}

export function normalizeCustomization(c: Partial<Customization> | undefined): Customization {
  return {
    instructions: sanitizeText(c?.instructions, MAX_INSTRUCTIONS),
    phoneModel: sanitizeLine(c?.phoneModel, MAX_PHONE_MODEL),
    referenceImageName: sanitizeLine(c?.referenceImageName, 120),
  };
}

function sameCustomization(a: Customization, b: Customization): boolean {
  return a.instructions === b.instructions && a.phoneModel === b.phoneModel && a.referenceImageName === b.referenceImageName;
}

let counter = 0;
export function newLineId(): string {
  counter += 1;
  return `l${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function addItem(
  cart: Cart,
  catalog: CatalogLookup,
  item: { productId: string; variantId: string; quantity: number; customization?: Partial<Customization> },
  makeId: () => string = newLineId,
): Cart {
  if (!catalog.find(item.productId, item.variantId)) throw new Error('Producto no encontrado en el catálogo');
  const customization = normalizeCustomization(item.customization);
  const quantity = clampQuantity(item.quantity);
  const existing = cart.lines.find(
    (l) => l.productId === item.productId && l.variantId === item.variantId && sameCustomization(l.customization, customization),
  );
  if (existing) {
    return {
      lines: cart.lines.map((l) => (l === existing ? { ...l, quantity: clampQuantity(l.quantity + quantity) } : l)),
    };
  }
  return { lines: [...cart.lines, { id: makeId(), productId: item.productId, variantId: item.variantId, quantity, customization }] };
}

export function updateQuantity(cart: Cart, lineId: string, quantity: number): Cart {
  return { lines: cart.lines.map((l) => (l.id === lineId ? { ...l, quantity: clampQuantity(quantity) } : l)) };
}

export function updateCustomization(cart: Cart, lineId: string, customization: Partial<Customization>): Cart {
  return {
    lines: cart.lines.map((l) =>
      l.id === lineId ? { ...l, customization: normalizeCustomization({ ...l.customization, ...customization }) } : l,
    ),
  };
}

export function removeLine(cart: Cart, lineId: string): Cart {
  return { lines: cart.lines.filter((l) => l.id !== lineId) };
}

export function clearCart(): Cart {
  return EMPTY_CART;
}

export function summarize(cart: Cart, catalog: CatalogLookup): CartSummary {
  const lines: PricedLine[] = [];
  for (const line of cart.lines) {
    const found = catalog.find(line.productId, line.variantId);
    if (!found) continue;
    const unitPrice = found.variant.price;
    lines.push({
      line,
      product: found.product,
      variant: found.variant,
      unitPrice,
      subtotal: unitPrice === null ? null : unitPrice * line.quantity,
    });
  }
  return {
    lines,
    itemCount: lines.reduce((n, l) => n + l.line.quantity, 0),
    productsTotal: lines.reduce((sum, l) => sum + (l.subtotal ?? 0), 0),
    hasQuoteItems: lines.some((l) => l.unitPrice === null),
  };
}

/**
 * Reconstruye un carrito desde datos no confiables (localStorage):
 * descarta líneas de productos inexistentes y normaliza cantidades y textos.
 */
export function restoreCart(raw: unknown, catalog: CatalogLookup): Cart {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as Cart).lines)) return EMPTY_CART;
  const lines: CartLine[] = [];
  const usedIds = new Set<string>();
  for (const l of (raw as { lines: unknown[] }).lines.slice(0, 100)) {
    if (!l || typeof l !== 'object') continue;
    const r = l as Record<string, unknown>;
    if (typeof r.productId !== 'string' || typeof r.variantId !== 'string') continue;
    if (!catalog.find(r.productId, r.variantId)) continue;
    let id = typeof r.id === 'string' && r.id.length > 0 && r.id.length <= 40 ? r.id : newLineId();
    while (usedIds.has(id)) id = newLineId(); // ids repetidos harían que una línea modifique a otra
    usedIds.add(id);
    lines.push({
      id,
      productId: r.productId,
      variantId: r.variantId,
      quantity: clampQuantity(r.quantity),
      customization: normalizeCustomization(r.customization as Partial<Customization>),
    });
  }
  return { lines };
}

/** Verifica los campos obligatorios de personalización antes de preparar el pedido. */
export function missingRequiredFields(summary: CartSummary): { lineId: string; productName: string; field: 'modeloCelular' }[] {
  const out: { lineId: string; productName: string; field: 'modeloCelular' }[] = [];
  for (const l of summary.lines) {
    if (l.product.required?.includes('modeloCelular') && !isValidPhoneModel(l.line.customization.phoneModel)) {
      out.push({ lineId: l.line.id, productName: `${l.product.name} – ${l.variant.label}`, field: 'modeloCelular' });
    }
  }
  return out;
}
