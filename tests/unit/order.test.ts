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
    expect(m.split('\n')).toEqual([
      'Hola, quiero hacer este pedido (SR-261023-ABCD):',
      '',
      '1. Retablo rectangular – 30 × 40 cm x2 = $60.000',
      '   Personalización: Foto de grado / con nombre "Ana & Luis"',
      '   Foto de referencia: te la envío por aquí',
      '2. Forro personalizado para celular – Laminado brillante x1 = $25.000',
      '   Modelo de celular: iPhone 13',
      '3. Tarjetas personalizadas x20 = por cotizar',
      '',
      '*Total:* $85.000 + productos por cotizar + envío',
      '*Pago:* Transferencia',
      '*Entrega:* envío a domicilio, Calle 1 # 2-3, Corozal',
      '*Nombre:* María Pérez',
      '*Teléfono:* 300 123 4567',
    ]);
    expect(m).not.toContain('grado.jpg');
    expect(m).not.toMatch(/pagado|pago confirmado|registrado/i);

    const url = new URL(result.link);
    expect(url.origin + url.pathname).toBe('https://wa.me/573013804470');
    expect(url.searchParams.get('text')).toBe(m);
    expect(result.link).not.toContain(' ');
    expect(result.link).toContain('%26'); // "&" codificado
  });

  it('omite los campos vacíos: teléfono, pago sin definir y notas', () => {
    const r = prepareOrder(sampleSummary(), { ...EMPTY_CUSTOMER, name: 'Ana' }, channel, { reference: 'SR-1', now });
    if (!r.ok) throw new Error('esperaba ok');
    expect(r.message).not.toMatch(/Teléfono|Pago|Nota/);
    expect(r.message).toContain('*Entrega:* la acordamos por aquí');
    expect(r.message).toContain('*Total:* $85.000 + productos por cotizar\n');
  });

  it('incluye "paso a recogerlo", efectivo y la nota del cliente', () => {
    const cart = addItem(EMPTY_CART, catalog, { productId: 'llavero', variantId: 'unidad', quantity: 3 });
    const r = prepareOrder(summarize(cart, catalog), { ...EMPTY_CUSTOMER, name: 'Ana', delivery: 'recoger', payment: 'efectivo', notes: 'Lo necesito\npara el viernes' }, channel, { reference: 'SR-4', now });
    if (!r.ok) throw new Error('esperaba ok');
    expect(r.message).toContain('1. Llavero personalizado x3 = $36.000');
    expect(r.message).toContain('*Total:* $36.000\n');
    expect(r.message).toContain('*Pago:* Efectivo');
    expect(r.message).toContain('*Entrega:* paso a recogerlo');
    expect(r.message).toContain('*Nota:* Lo necesito / para el viernes');
    expect(r.order.customer.delivery).toBe('recoger');
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
    const totals = r.message.split('\n').filter((l) => l.startsWith('*Total:*'));
    expect(totals).toEqual(['*Total:* $37.000 + envío']);
    expect(r.message.split('\n').filter((l) => l.startsWith('*Entrega:*'))).toEqual(['*Entrega:* envío a domicilio, Calle 1, Sinc elejo']);
    expect(r.message).toContain('*Nombre:* Ana ＊Envío:＊ gratis');
    expect(r.message).toContain('Modelo de celular: X ＊Total de productos:＊ $1');
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
