import type { Category, CategoryId, UpcomingLine } from '../domain/product';

const img = (src: string, alt: string, kind: 'real' | 'ilustrativa' = 'real') => ({ src: `images/products/${src}`, alt, kind });

export const categories: Category[] = [
  { id: 'retablos', name: 'Retablos personalizados', shortName: 'Retablos', tagline: 'Cuadrados y rectangulares, de 10 × 15 a 100 × 120 cm', cover: img('retablos/cuadrado-60x60', 'Retablo personalizado con foto de celebración') },
  { id: 'forros', name: 'Forros para celulares', shortName: 'Forros', tagline: 'Laminado en glitter o brillante', cover: img('forros/glitter', 'Forros personalizados para celular') },
  { id: 'llaveros', name: 'Llaveros', shortName: 'Llaveros', tagline: 'Con nombres, fechas, fotos o frases', cover: img('llaveros/llavero-1', 'Llavero personalizado con fotografía') },
  { id: 'polaroid', name: 'Fotos polaroid', shortName: 'Polaroid', tagline: 'Tus fotos en formato polaroid', cover: img('polaroid/polaroid-1', 'Fotos polaroid impresas') },
  { id: 'pendones', name: 'Pendones', shortName: 'Pendones', tagline: 'Incluyen tubos para colgar', cover: img('pendones/pendon-50x70', 'Imagen ilustrativa de un pendón', 'ilustrativa') },
  { id: 'tarjetas-presentacion', name: 'Tarjetas de presentación', shortName: 'Tarjetas', tagline: 'Millar a una o a doble cara', cover: img('tarjetas-presentacion/una-cara', 'Imagen ilustrativa de tarjetas de presentación', 'ilustrativa') },
  { id: 'stickers', name: 'Stickers', shortName: 'Stickers', tagline: 'Paquetes de 100, sin laminar o laminados', cover: img('stickers/stickers-sr', 'Stickers personalizados') },
  { id: 'otros', name: 'Otros productos personalizados', shortName: 'Otros', tagline: 'Tarjetas personalizadas y más, por cotización', cover: img('tarjetas/personalizadas-1', 'Tarjetas personalizadas') },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function isCategoryId(id: string): id is CategoryId {
  return categories.some((c) => c.id === id);
}

/**
 * Líneas que el negocio planea incorporar. No tienen precio ni se pueden añadir
 * al carrito hasta que se confirmen; para activarlas, muévelas a products.ts.
 */
export const upcomingLines: UpcomingLine[] = [
  { id: 'vasos', name: 'Vasos personalizados', description: 'Vasos con tu diseño, foto o frase.', status: 'pendiente-de-confirmar' },
  { id: 'mugs', name: 'Mugs personalizados', description: 'Mugs con fotos, nombres o mensajes.', status: 'pendiente-de-confirmar' },
  { id: 'forrado-paredes', name: 'Forrado de paredes', description: 'Impresión para cubrir y decorar paredes.', status: 'pendiente-de-confirmar' },
  { id: 'forrado-objetos', name: 'Personalización y forrado de objetos', description: 'Objetos forrados o personalizados con tu diseño.', status: 'pendiente-de-confirmar' },
  { id: 'promocionales', name: 'Nuevos diseños y productos promocionales', description: 'Artículos para promocionar tu marca o evento.', status: 'pendiente-de-confirmar' },
  { id: 'otras-lineas', name: 'Otras líneas de impresión', description: 'Nuevas líneas que iremos incorporando.', status: 'pendiente-de-confirmar' },
];
