/**
 * ÚNICA fuente de verdad del catálogo: nombres, medidas, precios (COP) e imágenes.
 * Fuente: "CATÁLOGO SINCELEJO RETABLOS" (PDF, 17 páginas).
 *
 * Para cambiar un precio, edítalo aquí y en ningún otro archivo.
 * `price: null` significa "precio no publicado": se ofrece cotización por WhatsApp.
 */
import type { Product, ProductImage, Variant } from '../domain/product';

const RETABLO_DESC =
  'Elaborados con acabado laminado, que brinda mayor durabilidad y un excelente realce de colores.';

const real = (src: string, alt: string): ProductImage => ({ src: `images/products/${src}`, alt, kind: 'real' });
const ilustrativa = (src: string, alt: string): ProductImage => ({ src: `images/products/${src}`, alt, kind: 'ilustrativa' });

function retablo(id: string, w: number, h: number, price: number, image: ProductImage): Variant {
  return { id, label: `${w} × ${h} cm`, size: `${w} × ${h} cm`, price, unit: 'unidad', image };
}

export const products: Product[] = [
  {
    id: 'retablo-cuadrado',
    category: 'retablos',
    group: 'Medidas cuadradas',
    name: 'Retablo cuadrado',
    description: RETABLO_DESC,
    display: 'por-variante',
    highlights: ['Acabado laminado', 'Con tu foto o diseño'],
    customization: ['instrucciones', 'imagenReferencia'],
    customizationHint: 'Cuéntanos qué foto o diseño quieres, textos, nombres o fechas.',
    images: [],
    variants: [
      retablo('20x20', 20, 20, 10000, real('retablos/cuadrado-20x20', 'Retablos cuadrados de 20 × 20 cm con fotos de pareja en la playa')),
      retablo('30x30', 30, 30, 22000, real('retablos/cuadrado-30x30', 'Retablo cuadrado de 30 × 30 cm con diseño infantil de elefante y el nombre Alaia')),
      retablo('40x40', 40, 40, 35000, real('retablos/cuadrado-40x40', 'Retablo cuadrado de 40 × 40 cm con foto familiar')),
      retablo('60x60', 60, 60, 65000, real('retablos/cuadrado-60x60', 'Retablo cuadrado de 60 × 60 cm con foto de celebración y arco de globos')),
      retablo('100x100', 100, 100, 140000, real('retablos/cuadrado-100x100', 'Retablo cuadrado de 100 × 100 cm con foto de bebé y su nombre')),
    ],
  },
  {
    id: 'retablo-rectangular',
    category: 'retablos',
    group: 'Medidas rectangulares',
    name: 'Retablo rectangular',
    description: RETABLO_DESC,
    display: 'por-variante',
    highlights: ['Acabado laminado', 'Con tu foto o diseño'],
    customization: ['instrucciones', 'imagenReferencia'],
    customizationHint: 'Cuéntanos qué foto o diseño quieres, textos, nombres o fechas.',
    images: [],
    variants: [
      retablo('10x15', 10, 15, 5000, real('retablos/rect-10x15', 'Retablos rectangulares de 10 × 15 cm con retratos de grado')),
      retablo('15x20', 15, 20, 7000, real('retablos/rect-15x20', 'Retablo rectangular de 15 × 20 cm con foto de quinceañera')),
      retablo('20x30', 20, 30, 18000, real('retablos/rect-20x30', 'Retablos rectangulares de 20 × 30 cm con diseños de menú para negocio')),
      retablo('30x40', 30, 40, 30000, real('retablos/rect-30x40', 'Retablos rectangulares de 30 × 40 cm con diseños de zapatillas')),
      retablo('40x50', 40, 50, 45000, real('retablos/rect-40x50', 'Retablo rectangular de 40 × 50 cm con foto familiar')),
      retablo('40x60', 40, 60, 55000, real('retablos/rect-40x60', 'Retablo rectangular de 40 × 60 cm con foto de niña con vestido rosado')),
      retablo('50x70', 50, 70, 70000, real('retablos/rect-50x70', 'Retablo rectangular de 50 × 70 cm con foto en la playa')),
      retablo('60x80', 60, 80, 85000, real('retablos/rect-60x80', 'Retablo rectangular de 60 × 80 cm con foto de quince años')),
      retablo('100x120', 100, 120, 160000, real('retablos/rect-100x120', 'Retablo rectangular de 100 × 120 cm con imagen religiosa sobre el mar')),
    ],
  },
  {
    id: 'forro-celular',
    category: 'forros',
    name: 'Forro personalizado para celular',
    description:
      'Protege y dale estilo a tu celular con nuestros forros personalizados. Diseñamos cada pieza con la imagen, frase o personaje que elijas, cuidando cada detalle para que sea único y resistente.',
    display: 'selector',
    customization: ['modeloCelular', 'instrucciones', 'imagenReferencia'],
    required: ['modeloCelular'],
    customizationHint: 'Indica la imagen, frase o personaje que quieres en tu forro.',
    images: [],
    variants: [
      {
        id: 'glitter',
        label: 'Laminado en glitter',
        price: 25000,
        unit: 'unidad',
        image: real('forros/glitter', 'Forros de celular personalizados con acabado laminado en glitter'),
      },
      {
        id: 'brillante',
        label: 'Laminado brillante',
        price: 25000,
        unit: 'unidad',
        image: real('forros/brillante', 'Forros de celular personalizados con acabado laminado brillante'),
      },
    ],
  },
  {
    id: 'llavero',
    category: 'llaveros',
    name: 'Llavero personalizado',
    description:
      'Dale un toque especial a tus llaves con nuestros llaveros personalizados. Diseñados a tu gusto con nombres, fechas, imágenes o frases especiales, ideales para recordar momentos únicos o para obsequiar.',
    display: 'selector',
    customization: ['instrucciones', 'imagenReferencia'],
    customizationHint: 'Escribe el nombre, la fecha o la frase, y describe la imagen o el diseño.',
    images: [
      real('llaveros/llavero-1', 'Llavero personalizado con fotografía en blanco y negro'),
      real('llaveros/llavero-2', 'Llavero personalizado con collage de fotos'),
      real('llaveros/llavero-3', 'Llavero personalizado con foto de pareja en la mano'),
      real('llaveros/llavero-4', 'Llaveros personalizados con mensaje escrito'),
    ],
    variants: [{ id: 'unidad', label: 'Llavero', price: 12000, unit: 'unidad' }],
  },
  {
    id: 'foto-polaroid',
    category: 'polaroid',
    name: 'Fotos polaroid',
    description: 'Tus fotos impresas en formato polaroid.',
    display: 'selector',
    customization: ['instrucciones', 'imagenReferencia'],
    customizationHint: 'Indica cuántas fotos diferentes son y si llevan algún texto.',
    images: [
      real('polaroid/polaroid-1', 'Fotos polaroid impresas sostenidas en abanico'),
      real('polaroid/polaroid-2', 'Fotos polaroid impresas de una sesión fotográfica'),
    ],
    variants: [{ id: 'unidad', label: 'Foto polaroid', price: 3000, unit: 'unidad' }],
  },
  {
    id: 'pendon',
    category: 'pendones',
    name: 'Pendón',
    description: 'Incluye tubos para colgar.',
    display: 'por-variante',
    highlights: ['Incluye tubos para colgar'],
    customization: ['instrucciones', 'imagenReferencia'],
    customizationHint: 'Describe el diseño, los textos y los datos que debe llevar el pendón.',
    images: [],
    variants: [
      { id: '50x70', label: '50 × 70 cm', size: '50 × 70 cm', price: 25000, unit: 'unidad', image: ilustrativa('pendones/pendon-50x70', 'Imagen ilustrativa de un pendón publicitario de cafetería') },
      { id: '70x100', label: '70 × 100 cm', size: '70 × 100 cm', price: 37000, unit: 'unidad', image: ilustrativa('pendones/pendon-70x100', 'Imagen ilustrativa de un pendón publicitario de spa') },
      { id: '90x120', label: '90 × 120 cm', size: '90 × 120 cm', price: 55000, unit: 'unidad', image: ilustrativa('pendones/pendon-90x120', 'Imagen ilustrativa de un pendón publicitario de tienda de ropa') },
      { id: '100x150', label: '100 × 150 cm', size: '100 × 150 cm', price: 60000, unit: 'unidad', image: ilustrativa('pendones/pendon-100x150', 'Imagen ilustrativa de un pendón publicitario de agencia de viajes') },
      { id: '120x180', label: '120 × 180 cm', size: '120 × 180 cm', price: 90000, unit: 'unidad', image: ilustrativa('pendones/pendon-120x180', 'Imagen ilustrativa de un pendón publicitario de festival de música') },
    ],
  },
  {
    id: 'tarjetas-presentacion',
    category: 'tarjetas-presentacion',
    name: 'Tarjetas de presentación',
    description: 'Millar de tarjetas de presentación con tu diseño, a una o a doble cara.',
    display: 'selector',
    customization: ['instrucciones', 'imagenReferencia'],
    customizationHint: 'Escribe los datos de la tarjeta (nombre, cargo, teléfono, redes) y describe el diseño o el logo.',
    images: [],
    variants: [
      { id: 'una-cara', label: 'Millar a una cara', price: 70000, unit: 'millar', image: ilustrativa('tarjetas-presentacion/una-cara', 'Imagen ilustrativa de tarjetas de presentación a una cara') },
      { id: 'doble-cara', label: 'Millar a doble cara', price: 100000, unit: 'millar', image: ilustrativa('tarjetas-presentacion/doble-cara', 'Imagen ilustrativa de tarjetas de presentación a doble cara') },
    ],
  },
  {
    id: 'stickers',
    category: 'stickers',
    name: 'Stickers personalizados',
    description: 'Paquetes de 100 stickers con tu diseño, sin laminar o laminados.',
    display: 'selector',
    customization: ['instrucciones', 'imagenReferencia'],
    customizationHint: 'Describe el diseño, el logo o el texto de tus stickers.',
    images: [
      real('stickers/stickers-sr', 'Stickers circulares personalizados con el logo de Sincelejo Retablos'),
      ilustrativa('stickers/stickers-ilustrativo', 'Imagen ilustrativa de un rollo de stickers circulares para marca'),
    ],
    variants: [
      { id: 'sin-laminar', label: '100 stickers sin laminar', price: 25000, unit: 'paquete-100' },
      { id: 'laminados', label: '100 stickers laminados', price: 30000, unit: 'paquete-100' },
    ],
  },
  {
    id: 'tarjetas-personalizadas',
    category: 'otros',
    name: 'Tarjetas personalizadas',
    description: 'Ideales para todo tipo de ocasión. El precio depende del diseño y la cantidad: pide tu cotización.',
    display: 'selector',
    customization: ['instrucciones', 'imagenReferencia'],
    customizationHint: 'Cuéntanos la ocasión, la cantidad y el diseño que imaginas.',
    images: [
      real('tarjetas/personalizadas-1', 'Tarjetas de invitación personalizadas con foto'),
      real('tarjetas/personalizadas-2', 'Tarjetas personalizadas con diseño de globos'),
    ],
    variants: [{ id: 'cotizacion', label: 'Tarjetas personalizadas', price: null, unit: 'unidad' }],
  },
];
