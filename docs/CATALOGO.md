# Catálogo: productos, precios e imágenes

Todo el catálogo vive en **`src/catalog/products.ts`**. Es el único archivo con precios.

## Cambiar un precio

1. Busca el producto y la variante en `products.ts` y cambia `price` (entero en pesos, sin puntos: `22000`).
2. Actualiza el mismo valor en `tests/unit/catalog.test.ts` (tabla `OFFICIAL`).
3. Ejecuta `npm test`. Si la prueba pasa, haz commit.

## Agregar una medida a un producto existente

Agrega una variante. Para retablos:

```ts
retablo('25x25', 25, 25, 15000, real('retablos/cuadrado-25x25', 'Descripción de la foto')),
```

## Agregar un producto nuevo

```ts
{
  id: 'mug-personalizado',
  category: 'otros',
  name: 'Mug personalizado',
  description: 'Texto confirmado por el negocio.',
  display: 'selector',                       // 'por-variante' si cada medida tiene su foto
  customization: ['instrucciones', 'imagenReferencia'],
  customizationHint: 'Cuéntanos qué foto o frase quieres.',
  images: [real('otros/mug-1', 'Mug blanco con foto de pareja')],
  variants: [{ id: 'unidad', label: 'Mug', price: 20000, unit: 'unidad' }],
},
```

- `price: null` = se vende por cotización (no suma al total).
- `unit`: `'unidad'`, `'paquete-100'` o `'millar'`.
- Para activar una línea de **Novedades**, quítala de `upcomingLines` en `categories.ts` y crea el producto aquí con su precio confirmado.
- Para una categoría nueva, añade su id al tipo `CategoryId` (`src/domain/product.ts`) y a `categories`.

## Imágenes

Cada imagen se guarda en dos tamaños WebP: `nombre-480.webp` y `nombre-900.webp`, dentro de
`public/images/products/<categoría>/`. En el código se escribe la ruta **sin** sufijo: `'otros/mug-1'`.

Con cualquier editor: exporta la foto a 900 px de ancho y a 480 px de ancho en formato WebP (calidad ~80).
Con Python y Pillow:

```bash
python3 -c "from PIL import Image; im=Image.open('foto.jpg').convert('RGB');
[im.resize((w, round(im.height*w/im.width))).save(f'nombre-{w}.webp', quality=80) for w in (480, 900)]"
```

Usa `real(...)` para fotos de trabajos del negocio e `ilustrativa(...)` para maquetas o fotos de referencia:
las ilustrativas muestran la etiqueta "Imagen ilustrativa". La prueba `catalog.test.ts` falla si falta un archivo.

## Origen de las imágenes actuales

Extraídas del PDF "CATÁLOGO SINCELEJO RETABLOS" (17 páginas). Las de pendones, tarjetas de presentación y uno de los stickers
son maquetas genéricas con marcas ajenas, por eso se muestran como ilustrativas. Las portadas con los personajes antiguos no se usan:
los logos oficiales nuevos (`24910.jpg`, `24911.jpg`) los reemplazan.
