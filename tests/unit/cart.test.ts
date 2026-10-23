import { describe, expect, it } from 'vitest';
import { catalog } from '../../src/catalog';
import {
  EMPTY_CART,
  MAX_QTY,
  addItem,
  clampQuantity,
  missingRequiredFields,
  removeLine,
  restoreCart,
  summarize,
  updateCustomization,
  updateQuantity,
} from '../../src/domain/cart';
import { formatCOP } from '../../src/domain/money';

let n = 0;
const id = () => `t${++n}`;

describe('carrito', () => {
  it('agrega productos y calcula subtotales y total desde el catálogo', () => {
    let cart = addItem(EMPTY_CART, catalog, { productId: 'retablo-cuadrado', variantId: '30x30', quantity: 2 }, id);
    cart = addItem(cart, catalog, { productId: 'stickers', variantId: 'laminados', quantity: 1 }, id);
    cart = addItem(cart, catalog, { productId: 'foto-polaroid', variantId: 'unidad', quantity: 10 }, id);
    const s = summarize(cart, catalog);
    expect(s.lines.map((l) => l.subtotal)).toEqual([44000, 30000, 30000]);
    expect(s.productsTotal).toBe(104000);
    expect(s.itemCount).toBe(13);
    expect(s.hasQuoteItems).toBe(false);
  });

  it('une líneas idénticas y separa las que tienen personalización distinta', () => {
    let cart = addItem(EMPTY_CART, catalog, { productId: 'llavero', variantId: 'unidad', quantity: 1, customization: { instructions: 'Ana' } }, id);
    cart = addItem(cart, catalog, { productId: 'llavero', variantId: 'unidad', quantity: 2, customization: { instructions: 'Ana' } }, id);
    cart = addItem(cart, catalog, { productId: 'llavero', variantId: 'unidad', quantity: 1, customization: { instructions: 'Luis' } }, id);
    expect(cart.lines).toHaveLength(2);
    expect(cart.lines[0]!.quantity).toBe(3);
    expect(summarize(cart, catalog).productsTotal).toBe(48000);
  });

  it('modifica cantidades, elimina líneas y recalcula', () => {
    let cart = addItem(EMPTY_CART, catalog, { productId: 'pendon', variantId: '120x180', quantity: 1 }, id);
    const lineId = cart.lines[0]!.id;
    cart = updateQuantity(cart, lineId, 3);
    expect(summarize(cart, catalog).productsTotal).toBe(270000);
    cart = removeLine(cart, lineId);
    expect(summarize(cart, catalog).productsTotal).toBe(0);
    expect(cart.lines).toHaveLength(0);
  });

  it('valida cantidades: enteros entre 1 y 999', () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
    expect(clampQuantity(2.7)).toBe(2);
    expect(clampQuantity('abc')).toBe(1);
    expect(clampQuantity(NaN)).toBe(1);
    expect(clampQuantity(5000)).toBe(MAX_QTY);
    let cart = addItem(EMPTY_CART, catalog, { productId: 'llavero', variantId: 'unidad', quantity: 998 }, id);
    cart = addItem(cart, catalog, { productId: 'llavero', variantId: 'unidad', quantity: 5 }, id);
    expect(cart.lines[0]!.quantity).toBe(999);
  });

  it('rechaza productos que no existen', () => {
    expect(() => addItem(EMPTY_CART, catalog, { productId: 'mug', variantId: 'unidad', quantity: 1 }, id)).toThrow();
  });

  it('los productos por cotizar no suman al total', () => {
    let cart = addItem(EMPTY_CART, catalog, { productId: 'tarjetas-personalizadas', variantId: 'cotizacion', quantity: 50 }, id);
    cart = addItem(cart, catalog, { productId: 'llavero', variantId: 'unidad', quantity: 1 }, id);
    const s = summarize(cart, catalog);
    expect(s.productsTotal).toBe(12000);
    expect(s.hasQuoteItems).toBe(true);
    expect(s.lines[0]!.subtotal).toBeNull();
  });

  it('restaura datos guardados ignorando precios manipulados y productos inexistentes', () => {
    const tampered = {
      lines: [
        { id: 'a', productId: 'retablo-cuadrado', variantId: '20x20', quantity: 2, price: 1, customization: { instructions: 'ok' } },
        { id: 'b', productId: 'no-existe', variantId: 'x', quantity: 1 },
        { id: 'c', productId: 'llavero', variantId: 'unidad', quantity: -40 },
        'basura',
      ],
    };
    const cart = restoreCart(tampered, catalog);
    expect(cart.lines).toHaveLength(2);
    expect(cart.lines[1]!.quantity).toBe(1);
    expect(summarize(cart, catalog).productsTotal).toBe(20000 + 12000);
    expect(restoreCart(null, catalog)).toEqual(EMPTY_CART);
    expect(restoreCart({ lines: 'x' }, catalog)).toEqual(EMPTY_CART);
  });

  it('exige el modelo de celular en los forros', () => {
    let cart = addItem(EMPTY_CART, catalog, { productId: 'forro-celular', variantId: 'glitter', quantity: 1 }, id);
    expect(missingRequiredFields(summarize(cart, catalog))).toHaveLength(1);
    cart = updateCustomization(cart, cart.lines[0]!.id, { phoneModel: 'Moto G54' });
    expect(missingRequiredFields(summarize(cart, catalog))).toHaveLength(0);
  });

  it('recorta textos largos y elimina caracteres de control', () => {
    const cart = addItem(EMPTY_CART, catalog, { productId: 'llavero', variantId: 'unidad', quantity: 1, customization: { instructions: `hola\u0000${'x'.repeat(900)}` } }, id);
    expect(cart.lines[0]!.customization.instructions.length).toBe(500);
    expect(cart.lines[0]!.customization.instructions.includes('\u0000')).toBe(false);
  });
});

describe('formato COP', () => {
  it('formatea con punto de miles y sin decimales', () => {
    expect(formatCOP(3000)).toBe('$3.000');
    expect(formatCOP(160000)).toBe('$160.000');
    expect(formatCOP(1234567)).toBe('$1.234.567');
    expect(formatCOP(0)).toBe('$0');
    expect(() => formatCOP(Infinity)).toThrow();
  });
});
