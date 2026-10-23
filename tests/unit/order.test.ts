import { describe, expect, it } from 'vitest';
import { markSentByCustomer, markWhatsAppOpened, prepareOrder } from '../../src/application/prepareOrder';
import { buildOrderMessage, createWhatsAppOrderChannel, whatsappLink } from '../../src/adapters/whatsapp/whatsappOrderChannel';
import { readWhatsAppNumber } from '../../src/config/env';
import { catalog } from '../../src/catalog';
import { EMPTY_CART, addItem, summarize } from '../../src/domain/cart';
import { EMPTY_CUSTOMER, canTransition, createOrderReference, isValidColombianPhone, validateCustomer, type OrderSnapshot } from '../../src/domain/order';
import { canTransitionPayment } from '../../src/domain/payment';
import type { OrderHistory } from '../../src/ports';

const channel = createWhatsAppOrderChannel('573013804470');
const now = new Date('2026-10-23T15:00:00Z');

function sampleSummary() {
  let cart = addItem(EMPTY_CART, catalog, { productId: 'retablo-rectangular', variantId: '30x40', quantity: 2, customization: { instructions: 'Foto de grado\ncon nombre "Ana & Luis"', referenceImageName: 'grado.jpg' } });
  cart = addItem(cart, catalog, { productId: 'forro-celular', variantId: 'brillante', quantity: 1, customization: { phoneModel: 'iPhone 13' } });
  cart = addItem(cart, catalog, { productId: 'tarjetas-personalizadas', variantId: 'cotizacion', quantity: 20 });
  return summarize(cart, catalog);
}

describe('pedido por WhatsApp', () => {
  it('construye un mensaje completo y un enlace correctamente codificado', () => {
    const result = prepareOrder(sampleSummary(), { ...EMPTY_CUSTOMER, name: 'María Pérez', phone: '300 123 4567', delivery: 'domicilio', city: 'Corozal', address: 'Calle 1 # 2-3', payment: 'transferencia' }, channel, { reference: 'SR-261023-ABCD', now });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const m = result.message;
    expect(m).toContain('*Referencia:* SR-261023-ABCD');
    expect(m).toContain('*Nombre:* María Pérez');
    expect(m).toContain('*Teléfono:* 300 123 4567');
    expect(m).toContain('Retablo rectangular – 30 × 40 cm');
    expect(m).toContain('Cantidad: 2 × $30.000 (por unidad) = $60.000');
    expect(m).toContain('Modelo de celular: iPhone 13');
    expect(m).toContain('Personalización: Foto de grado / con nombre "Ana & Luis"');
    expect(m).toContain('Imagen de referencia: grado.jpg');
    expect(m).toContain('Precio: por cotizar');
    expect(m).toContain('*Total de productos:* $85.000 + productos por cotizar');
    expect(m).toContain('*Envío:* pendiente de cotización');
    expect(m).toContain('*Entrega a domicilio:* Calle 1 # 2-3, Corozal');
    expect(m).toContain('*Forma de pago preferida:* Transferencia');
    expect(m).not.toMatch(/pagado|pago confirmado|registrado/i);

    const url = new URL(result.link);
    expect(url.origin + url.pathname).toBe('https://wa.me/573013804470');
    expect(url.searchParams.get('text')).toBe(m);
    expect(result.link).not.toContain(' ');
    expect(result.link).toContain('%26'); // "&" codificado
  });

  it('omite el teléfono si no se proporciona y usa "acordar" como entrega', () => {
    const r = prepareOrder(sampleSummary(), { ...EMPTY_CUSTOMER, name: 'Ana' }, channel, { reference: 'SR-1', now });
    expect(r.ok && r.message).not.toContain('Teléfono');
    expect(r.ok && r.message).toContain('*Entrega:* acordar por este chat');
  });

  it('no prepara el pedido con datos inválidos, carrito vacío o forro sin modelo', () => {
    const bad = prepareOrder(sampleSummary(), { ...EMPTY_CUSTOMER, name: 'A', phone: '123', delivery: 'domicilio' }, channel);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.customerErrors).sort()).toEqual(['address', 'city', 'name', 'phone']);
    const empty = prepareOrder(summarize(EMPTY_CART, catalog), { ...EMPTY_CUSTOMER, name: 'Ana' }, channel);
    expect(!empty.ok && empty.emptyCart).toBe(true);
    const forro = summarize(addItem(EMPTY_CART, catalog, { productId: 'forro-celular', variantId: 'glitter', quantity: 1 }), catalog);
    const r = prepareOrder(forro, { ...EMPTY_CUSTOMER, name: 'Ana' }, channel);
    expect(!r.ok && r.missing).toHaveLength(1);
  });

  it('valida teléfonos colombianos', () => {
    expect(isValidColombianPhone('3013804470')).toBe(true);
    expect(isValidColombianPhone('+57 301 380 4470')).toBe(true);
    expect(isValidColombianPhone('6052801234')).toBe(true);
    expect(isValidColombianPhone('12345')).toBe(false);
    expect(validateCustomer({ ...EMPTY_CUSTOMER, name: '  Jo  ' })).toEqual({});
  });

  it('abrir WhatsApp no marca el pedido como enviado; solo la declaración del cliente lo hace', () => {
    const r = prepareOrder(sampleSummary(), { ...EMPTY_CUSTOMER, name: 'Ana' }, channel, { reference: 'SR-2', now });
    if (!r.ok) throw new Error('esperaba ok');
    let saved: OrderSnapshot | null = null;
    const history: OrderHistory = { saveLast: (o) => (saved = o), loadLast: () => saved, clear: () => (saved = null) };
    expect(r.order.status).toBe('carrito-preparado');
    const opened = markWhatsAppOpened(r.order, history, now);
    expect(opened.status).toBe('carrito-preparado');
    expect(opened.whatsappOpenedAt).toBe(now.toISOString());
    expect(history.loadLast()?.status).toBe('carrito-preparado');
    const sent = markSentByCustomer(opened, history);
    expect(sent.status).toBe('enviado-al-negocio');
    expect(sent.sentDeclaredByCustomer).toBe(true);
    expect(history.loadLast()?.status).toBe('enviado-al-negocio');
    expect(markSentByCustomer(sent, history)).toBe(sent);
  });

  it('los saltos de línea en campos del cliente no crean líneas falsas en el mensaje', () => {
    let cart = addItem(EMPTY_CART, catalog, { productId: 'forro-celular', variantId: 'glitter', quantity: 1, customization: { phoneModel: 'X\n*Total de productos:* $1', referenceImageName: 'a\nb.jpg' } });
    cart = addItem(cart, catalog, { productId: 'llavero', variantId: 'unidad', quantity: 1, customization: { instructions: 'uno\ndos' } });
    const base = { ...EMPTY_CUSTOMER, name: 'Ana\n*Envío:* gratis', delivery: 'domicilio' as const, city: 'Sinc\nelejo', address: 'Calle\n1', notes: 'a\nb' };
    const r = prepareOrder(summarize(cart, catalog), base, channel, { reference: 'SR-3', now });
    if (!r.ok) throw new Error('esperaba ok');
    const totals = r.message.split('\n').filter((l) => l.startsWith('*Total de productos:*'));
    expect(totals).toEqual(['*Total de productos:* $37.000']);
    expect(r.message.split('\n').filter((l) => l.startsWith('*Envío:*'))).toEqual(['*Envío:* pendiente de cotización']);
    expect(r.message).toContain('*Nombre:* Ana *Envío:* gratis');
  });

  it('las transiciones de estado no permiten saltar a "pago confirmado"', () => {
    expect(canTransition('carrito-preparado', 'pago-confirmado')).toBe(false);
    expect(canTransition('enviado-al-negocio', 'confirmado-por-negocio')).toBe(true);
    expect(canTransitionPayment('no-iniciado', 'aprobado')).toBe(false);
    expect(canTransitionPayment('pendiente', 'aprobado')).toBe(true);
    expect(canTransitionPayment('aprobado', 'pendiente')).toBe(false);
  });

  it('genera referencias con formato SR-AAMMDD-XXXX', () => {
    expect(createOrderReference(new Date(2026, 9, 23), () => 0)).toBe('SR-261023-AAAA');
  });

  it('usa el número internacional y valida la configuración', () => {
    expect(whatsappLink('573013804470')).toBe('https://wa.me/573013804470');
    expect(readWhatsAppNumber(undefined)).toBe('573013804470');
    expect(readWhatsAppNumber('+57 301 380 4470')).toBe('573013804470');
    expect(readWhatsAppNumber('3013804470')).toBe('573013804470'); // sin indicativo: se usa el oficial
    expect(buildOrderMessage).toBeTypeOf('function');
  });
});
