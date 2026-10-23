import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { catalog, categories, minPrice, products, upcomingLines } from '../../src/catalog';

/** Precios oficiales del catálogo PDF. Si esta prueba falla, alguien cambió un precio. */
const OFFICIAL: Record<string, Record<string, number | null>> = {
  'retablo-cuadrado': { '20x20': 10000, '30x30': 22000, '40x40': 35000, '60x60': 65000, '100x100': 140000 },
  'retablo-rectangular': {
    '10x15': 5000, '15x20': 7000, '20x30': 18000, '30x40': 30000, '40x50': 45000,
    '40x60': 55000, '50x70': 70000, '60x80': 85000, '100x120': 160000,
  },
  'forro-celular': { glitter: 25000, brillante: 25000 },
  llavero: { unidad: 12000 },
  'foto-polaroid': { unidad: 3000 },
  pendon: { '50x70': 25000, '70x100': 37000, '90x120': 55000, '100x150': 60000, '120x180': 90000 },
  'tarjetas-presentacion': { 'una-cara': 70000, 'doble-cara': 100000 },
  stickers: { 'sin-laminar': 25000, laminados: 30000 },
  'tarjetas-personalizadas': { cotizacion: null },
};

describe('catálogo oficial', () => {
  it('contiene exactamente los productos y variantes oficiales con sus precios', () => {
    const actual = Object.fromEntries(products.map((p) => [p.id, Object.fromEntries(p.variants.map((v) => [v.id, v.price]))]));
    expect(actual).toEqual(OFFICIAL);
  });

  it('las medidas de las etiquetas coinciden con el identificador de la variante', () => {
    for (const p of products.filter((x) => x.display === 'por-variante')) {
      for (const v of p.variants) {
        const [w, h] = v.id.split('x');
        expect(v.size).toBe(`${w} × ${h} cm`);
      }
    }
  });

  it('distingue unidades, paquetes de 100 y millares', () => {
    const units = Object.fromEntries(products.flatMap((p) => p.variants.map((v) => [`${p.id}/${v.id}`, v.unit])));
    expect(units['stickers/sin-laminar']).toBe('paquete-100');
    expect(units['stickers/laminados']).toBe('paquete-100');
    expect(units['tarjetas-presentacion/una-cara']).toBe('millar');
    expect(units['tarjetas-presentacion/doble-cara']).toBe('millar');
    expect(units['retablo-cuadrado/20x20']).toBe('unidad');
  });

  it('todas las imágenes referenciadas existen en public/ en ambos tamaños', () => {
    const srcs = new Set<string>();
    for (const p of products) {
      p.images.forEach((i) => srcs.add(i.src));
      p.variants.forEach((v) => v.image && srcs.add(v.image.src));
    }
    categories.forEach((c) => srcs.add(c.cover.src));
    for (const src of srcs) {
      for (const w of [480, 900]) expect(existsSync(resolve('public', `${src}-${w}.webp`)), `${src}-${w}.webp`).toBe(true);
    }
  });

  it('cada producto pertenece a una categoría existente y cada categoría tiene productos', () => {
    const ids = categories.map((c) => c.id);
    products.forEach((p) => expect(ids).toContain(p.category));
    ids.forEach((id) => expect(products.some((p) => p.category === id)).toBe(true));
  });

  it('los textos alternativos no están vacíos y las maquetas se marcan como ilustrativas', () => {
    for (const p of products) {
      for (const img of [...p.images, ...p.variants.flatMap((v) => (v.image ? [v.image] : []))]) {
        expect(img.alt.length).toBeGreaterThan(10);
        if (img.kind === 'ilustrativa') expect(img.alt.toLowerCase()).toContain('ilustrativa');
      }
    }
    const pendones = products.find((p) => p.id === 'pendon')!;
    expect(pendones.variants.every((v) => v.image?.kind === 'ilustrativa')).toBe(true);
  });

  it('las líneas futuras no tienen precio ni pueden agregarse al carrito', () => {
    for (const u of upcomingLines) {
      expect(u).not.toHaveProperty('price');
      expect(catalog.find(u.id, 'unidad')).toBeUndefined();
    }
  });

  it('calcula el precio mínimo por categoría', () => {
    expect(minPrice('retablos')).toBe(5000);
    expect(minPrice('otros')).toBeNull();
  });
});

import { searchProducts } from '../../src/catalog';
describe('búsqueda', () => {
  it('filtra por medida dentro de los productos con tarjeta por medida', () => {
    const r = searchProducts('30 x 40');
    expect(r).toHaveLength(1);
    expect(r[0]!.variants.map((v) => v.id)).toEqual(['30x40']);
    expect(searchProducts('retablo').flatMap((p) => p.variants)).toHaveLength(14);
    expect(searchProducts('stickers laminados')).toHaveLength(1);
    expect(searchProducts('mug')).toHaveLength(0);
  });
});
