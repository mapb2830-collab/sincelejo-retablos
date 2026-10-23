/** Modelo del catálogo. Los precios son enteros en pesos colombianos (COP). */

export type CategoryId =
  | 'retablos'
  | 'forros'
  | 'llaveros'
  | 'polaroid'
  | 'pendones'
  | 'tarjetas-presentacion'
  | 'stickers'
  | 'otros';

/** Cómo se vende cada variante: así el cliente distingue una unidad de un paquete o un millar. */
export type SaleUnit = 'unidad' | 'paquete-100' | 'millar';

export interface ProductImage {
  /** Ruta base sin sufijo de tamaño, relativa a /public (p. ej. "images/products/forros/glitter"). */
  src: string;
  alt: string;
  /** "real": foto de producto del negocio. "ilustrativa": maqueta de referencia, no es un trabajo real. */
  kind: 'real' | 'ilustrativa';
}

export interface Variant {
  id: string;
  label: string;
  /** Medida legible, si aplica (p. ej. "20 × 20 cm"). */
  size?: string;
  /** null = precio no publicado; se vende por cotización. */
  price: number | null;
  unit: SaleUnit;
  image?: ProductImage;
}

export type CustomizationField = 'instrucciones' | 'modeloCelular' | 'imagenReferencia';

export interface Product {
  id: string;
  category: CategoryId;
  /** Subgrupo opcional dentro de la categoría (p. ej. "Cuadrados"). */
  group?: string;
  name: string;
  description: string;
  images: ProductImage[];
  variants: Variant[];
  /**
   * "por-variante": cada variante se muestra como una tarjeta (medidas con foto propia).
   * "selector": una tarjeta con selector de variante.
   */
  display: 'por-variante' | 'selector';
  customization: CustomizationField[];
  /** Texto de ayuda para las instrucciones de personalización. */
  customizationHint?: string;
  /** Campos que el cliente debe completar antes de enviar el pedido. */
  required?: CustomizationField[];
  highlights?: string[];
}

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  tagline: string;
  cover: ProductImage;
}

/** Línea futura: sin precio ni disponibilidad hasta que el negocio la confirme. */
export interface UpcomingLine {
  id: string;
  name: string;
  description: string;
  status: 'pendiente-de-confirmar';
}

export function isQuoteOnly(variant: Variant): boolean {
  return variant.price === null;
}

export const UNIT_LABEL: Record<SaleUnit, string> = {
  unidad: 'por unidad',
  'paquete-100': 'paquete de 100',
  millar: 'por millar (1.000)',
};
