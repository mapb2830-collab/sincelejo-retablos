import type { CatalogLookup } from '../domain/cart';
import type { CategoryId, Product, ProductImage, Variant } from '../domain/product';
import { products } from './products';

export { products } from './products';
export { categories, getCategory, isCategoryId, upcomingLines } from './categories';

export const catalog: CatalogLookup = {
  find(productId, variantId) {
    const product = products.find((p) => p.id === productId);
    const variant = product?.variants.find((v) => v.id === variantId);
    return product && variant ? { product, variant } : undefined;
  },
};

export function productsByCategory(category: CategoryId): Product[] {
  return products.filter((p) => p.category === category);
}

/** Precio mínimo publicado de una categoría (para "desde $X"). */
export function minPrice(category: CategoryId): number | null {
  const prices = productsByCategory(category)
    .flatMap((p) => p.variants)
    .map((v) => v.price)
    .filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

export function imageFor(product: Product, variant?: Variant): ProductImage | undefined {
  return variant?.image ?? product.images[0] ?? product.variants[0]?.image;
}

/**
 * Búsqueda por palabras (sin tildes; "30 x 40" = "30x40"). Si la búsqueda coincide con
 * medidas concretas, en los productos con una tarjeta por medida solo se devuelven esas medidas.
 */
export function searchProducts(query: string): Product[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return products;
  const out: Product[] = [];
  for (const p of products) {
    const productText = normalize(`${p.name} ${p.description}`);
    const variants = p.variants.filter((v) => {
      const text = `${productText} ${normalize(`${v.label} ${v.size ?? ''}`)}`;
      return tokens.every((t) => text.includes(t));
    });
    if (variants.length === 0) continue;
    out.push(p.display === 'por-variante' ? { ...p, variants } : p);
  }
  return out;
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/(\d)\s*[x×]\s*(\d)/g, '$1x$2')
    .trim();
}
