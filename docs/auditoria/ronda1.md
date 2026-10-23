# Auditoría técnica independiente · Ronda 1

**Proyecto:** `/home/claude/sincelejo-retablos` (Vite 8 + React 19 + TypeScript, GitHub Pages, enrutado por hash)
**Fecha:** 2026-10-23 · **Auditor:** Agente 2 (control de calidad). Solo lectura: no se modificó ningún archivo del proyecto. Los scripts de prueba propios están en `/home/claude/audit/`.

---

## 1. Resumen y veredicto

## Veredicto: **NO APROBADO**

La base es sólida. Los precios coinciden al 100 % con el PDF, cada foto corresponde a su producto y medida, las imágenes ilustrativas están marcadas, el mensaje de WhatsApp está bien codificado, el envío nunca se suma al total y el repositorio no contiene secretos. Aun así, encontré **1 error crítico** y **6 importantes**:

- **C1:** en escritorio (≥ ~1100 px) y en tableta (768 px), las tarjetas de forros, stickers y tarjetas de presentación recortan el nombre, la descripción y los **precios de las variantes**.
- Hay dos maneras de dejar **toda la aplicación en blanco**: un enlace con un `#` mal codificado, o un pedido guardado en `localStorage` con datos corruptos o de una versión anterior.
- La página registra "Pedido enviado al negocio" con solo pulsar el botón que abre WhatsApp, sin que el cliente haya enviado nada.
- Con `npm run dev`, el comando que recomienda el README, es **imposible agregar productos al carrito**: el diálogo se cierra en cuanto se abre.
- Hay defectos de accesibilidad: el borde de los campos tiene un contraste de 1,63:1 y el menú móvil no gestiona el foco.

| Categoría | Cantidad |
| --- | --- |
| Errores críticos | 1 |
| Errores importantes | 6 |
| Mejoras recomendadas | 15 |

---

## 2. Pruebas ejecutadas (comando → resultado)

| # | Comando / prueba | Resultado |
| --- | --- | --- |
| 1 | `npm run typecheck` (tsc 7.0.2) | OK, 0 errores |
| 2 | `npm test` (vitest 5.0.5) | 5 archivos, **32/32 pruebas superadas** |
| 3 | `npm run build` | OK. JS 297,05 kB (89,50 kB gzip), CSS 32,75 kB (9,47 kB gzip), `dist/` 5,5 MB (4,9 MB de imágenes). Nota: el build sobrescribió `dist/`, que está en `.gitignore` |
| 4 | `npm run test:e2e` (Playwright 1.56.1, escritorio + Pixel 7) | **19 superadas, 1 omitida** (la de teclado se omite en móvil por diseño de la prueba) |
| 5 | `npm audit` | `found 0 vulnerabilities` |
| 6 | Búsqueda de secretos en `git ls-files` (claves, tokens, `sk_live`, `AKIA…`, `ghp_…`, claves privadas) | Sin coincidencias reales (solo nombres de variables comentadas en `.env.example` y en la documentación) |
| 7 | `pdftotext` + render del PDF (`pdftoppm`) comparado con un montaje de las 33 imágenes de `public/images/products` | Precios, medidas y fotos coinciden (ver §4) |
| 8 | Script propio `browser1.mjs`: 14 rutas × 360/768/1366 px; desbordamiento horizontal con `body{overflow-x}` neutralizado, consola y capturas | Sin desbordamiento horizontal de página y sin errores ni avisos de consola |
| 9 | `browser3.mjs`: hash malformado, `localStorage` manipulado, flujo completo con caracteres especiales, decodificación del enlace `wa.me`, seguimiento, menú móvil con teclado, nombres accesibles, ids duplicados, `aria-describedby`, imágenes cargadas al inicio | Hallazgos I1, I2, I3, I6, M1 y M7 |
| 10 | `browser4.mjs` / `browser5.mjs`: foco en el diálogo, subtotal del diálogo, diálogo en modo desarrollo (`vite --port 5175`) | Hallazgos I4 y M2 |
| 11 | `browser6.mjs`: ancho de las tarjetas con selector y texto recortado a 360/700/768/900/1024/1366/1920 px | Hallazgo C1 |
| 12 | `contrast.py`: ratios WCAG de 30 pares de colores del CSS | Hallazgo I5; el resto de pares cumple |

Al terminar detuve los servidores auxiliares (4174 y 5175) por PID. `git status` sigue limpio.

---

## 3. Hallazgos

### 3.1 Errores críticos

#### C1. Las tarjetas con selector recortan títulos, descripciones y precios en tableta y escritorio
- **Archivo:** `src/styles/global.css:237-239` (`.grid`, `.grid--wide { grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)) }`) y `:254` (`.card--wide { flex-direction: row } .card__media { width: 46% }`); `.card { overflow: hidden }`.
- **Fallo:** `auto-fill` con un mínimo de 340 px crea 3 columnas en un contenedor de 1152 px. La única tarjeta queda en una columna de **369 px** (349 px a 768 px), y la foto ocupa el 46 % en fila. El cuerpo se queda en unos 190 px y el contenido se corta sin barra de desplazamiento. Medido con `browser6.mjs`:
  - **Forros** (768, 1366 y 1920 px): se cortan el título "Forro personalizado para…", la descripción y los precios de las variantes "$25.000" (se ve "$25.00").
  - **Stickers** (768, 1366 y 1920 px): se cortan el título, la descripción, "$25.000", "$30.000" y "paquete de 100". A 900 px se cortan el título y la descripción.
  - **Tarjetas de presentación** (768, 1366 y 1920 px): se cortan el título y la descripción.
  - Captura: `/home/claude/audit/forros1366.png`.

  Un precio truncado ("$25.00" en vez de "$25.000") en la vista principal de compra es un error de precios visible para el cliente. La prueba e2e de desbordamiento no lo detecta porque el contenido queda oculto por `overflow: hidden`.
- **Cómo reproducir:** `npm run build && npx vite preview`, ventana de 1366×800, abrir `#/catalogo/forros` o `#/catalogo/stickers`.
- **Corrección:**
  - Usar una sola columna para `.grid--wide` (`grid-template-columns: 1fr` con un `max-width` de unos 900 px), o subir el mínimo a ≥ 640 px.
  - O bien pasar a fila solo cuando la tarjeta mide ≥ 640 px, con `@container` en lugar de `@media` sobre el viewport.
- **Prueba que debe superar:** una e2e que, a 768, 1024, 1366 y 1920 px, recorra `forros`, `llaveros`, `polaroid`, `tarjetas-presentacion`, `stickers`, `otros` y `#/catalogo`, y compruebe que ningún descendiente de `.card__body` con texto tiene `getBoundingClientRect().right` mayor que el `right` de la tarjeta. También debe verificar que `.variant__price` muestra exactamente "$25.000", "$30.000", etc., y que es visible por completo (`toBeInViewport({ ratio: 1 })` tras hacer scroll).

### 3.2 Errores importantes

#### I1. Un enlace con un `#` mal codificado deja la tienda en blanco
- **Archivo:** `src/ui/router/router.ts:20` (`decodeURIComponent` sin `try/catch`). No hay *error boundary* en `src/ui/App.tsx`.
- **Fallo:** `decodeURIComponent('/catalogo/%E0%A4%A')` lanza `URIError: URI malformed` dentro del inicializador de `useState`. React desmonta todo el árbol y `#root` queda vacío. Basta con un enlace truncado al compartirlo por WhatsApp o redes. Si ocurre en un `hashchange`, el error sale en la consola y la página no cambia.
- **Cómo reproducir:** abrir `http://localhost:4173/#/catalogo/%E0%A4%A` → página en blanco y `pageerror: URI malformed` (verificado: `#root` con longitud 0).
- **Corrección:**
  - Envolver la decodificación en `try/catch` y devolver `{ name: 'no-encontrado' }`.
  - Añadir un *error boundary* global con un mensaje y un enlace a WhatsApp.
- **Prueba que debe superar:** una unitaria `parseHash('#/%')` y `parseHash('#/catalogo/%E0%A4%A')` → `{ name: 'no-encontrado' }` sin lanzar. Una e2e: `goto('./#/%E0%A4%A')` muestra "No encontramos esta página" y no hay errores de página.

#### I2. Un pedido guardado corrupto o de una versión anterior deja toda la app en blanco en "Seguimiento"
- **Archivos:** `src/adapters/storage/localOrderHistory.ts:15` (solo valida `reference` y `Array.isArray(lines)`); `src/ui/pages/InfoPages.tsx:39`, `:43` y `:45` (`formatCOP(l.subtotal)`, `formatCOP(order.productsTotal)`, `buildOrderMessage(order)`). `formatCOP` lanza `RangeError('Monto inválido')` con `undefined`.
- **Fallo:** cualquiera de estos valores en `sr.lastOrder.v1` desmonta la aplicación completa (encabezado y pie incluidos):
  - `{reference:'X', lines:[{}]}`
  - `{reference:'X', lines:[]}` sin `productsTotal`
  - una línea sin `unitPrice`, o un pedido sin `customer`

  Esto también pasará con los pedidos guardados por esta versión si en el futuro cambia la forma de `OrderSnapshot` y no se cambia la clave `v1`. La lista de inspección pide resistencia a `localStorage` manipulado. El carrito sí la tiene (`restoreCart`); el historial no.
- **Cómo reproducir:** en la consola, `localStorage.setItem('sr.lastOrder.v1', JSON.stringify({reference:'X', lines:[{}]}))` y luego abrir `#/seguimiento` → página en blanco, `pageerror: Monto inválido` (verificado en 3 variantes).
- **Corrección:**
  - Validar el pedido completo en `loadLast()`: tipos de cada línea, `productsTotal` numérico finito, `status` dentro de `ORDER_FLOW`, `customer` con sus campos y `createdAt` como fecha válida. Si falla, devolver `null` y borrar la clave.
  - Añadir un *error boundary*.
- **Prueba que debe superar:** una unitaria en la que `loadLast()` devuelva `null` para cada objeto inválido de la lista anterior. Una e2e en la que, con `sr.lastOrder.v1` corrupto, `#/seguimiento` muestre "Aún no has preparado un pedido en este navegador" y no haya `pageerror`.

#### I3. Se registra "Pedido enviado al negocio" cuando el cliente solo pulsó el botón que abre WhatsApp
- **Archivos:** `src/ui/pages/CheckoutPage.tsx:66-67` y `:179` (`onClick={onOpenWhatsApp}`); `src/application/prepareOrder.ts:40-44`; `src/ui/pages/InfoPages.tsx:29` (`Estado registrado: …`).
- **Fallo:** al hacer clic en "Abrir WhatsApp y enviar pedido", el pedido pasa a `enviado-al-negocio`. Seguimiento muestra "**Estado registrado: Pedido enviado al negocio**" con el paso 1 marcado como hecho (verificado en el navegador). Pero la página no puede saber si el cliente pulsó "Enviar" en WhatsApp: puede no tener WhatsApp, cerrar la pestaña o no enviar. La propia ayuda de `OrderSteps.tsx:6` dice "Abrir WhatsApp no envía nada por sí solo". El requisito exige distinguir con veracidad los estados "carrito preparado" y "enviado al negocio".
- **Cómo reproducir:** preparar un pedido, pulsar el botón verde (cerrar la ventana emergente sin enviar) e ir a `#/seguimiento`.
- **Corrección:** no afirmar el envío. Dos opciones:
  - Registrar un estado intermedio honesto, por ejemplo "WhatsApp abierto · confirma que enviaste el mensaje".
  - Mantener "Carrito preparado" y ofrecer un botón explícito "Ya envié el mensaje", con la etiqueta "Enviado (según indicaste)".
- **Prueba que debe superar:** una e2e en la que, tras pulsar "Abrir WhatsApp…" sin otra acción, `#/seguimiento` **no** contenga "Pedido enviado al negocio" como estado registrado. Una unitaria del caso de uso que distinga "abierto" de "enviado declarado por el cliente".

#### I4. En modo desarrollo (`npm run dev`) es imposible agregar productos: el diálogo se cierra al abrirse
- **Archivo:** `src/ui/components/AddToCartDialog.tsx:25-29` y `:46`.
- **Fallo:** en `StrictMode` (`src/main.tsx`), React monta, desmonta y vuelve a montar el efecto. La limpieza `dialog.close()` dispara de forma asíncrona el evento `close`, que llega después del segundo `showModal()` y ejecuta `onClose` → `setOpen(false)`. El diálogo desaparece. Verificado en `vite --port 5175`: tras pulsar "Agregar al carrito", `dialog` aparece 0 veces en el DOM a 0, 50, 200 y 600 ms, tanto en llaveros como en retablos. En producción no ocurre, pero el README (sección Comandos) indica `npm run dev` y "Abre http://localhost:5173 en Chrome" como forma de ver la página. Quien revise así la tienda verá el carrito roto, y el error oculta otros problemas durante el desarrollo.
- **Cómo reproducir:** `npm run dev` → `#/catalogo/llaveros` → "Agregar al carrito" → no aparece nada.
- **Corrección:** no cerrar el diálogo en la limpieza, o ignorar el evento `close` cuando no lo originó el usuario (por ejemplo con una bandera `ref` o con `requestAnimationFrame`). Otra opción es renderizar el `<dialog>` siempre y controlar `open` con un estado.
- **Prueba que debe superar:** una e2e (o una prueba de componente en Vitest con `StrictMode`) en la que, con el servidor de desarrollo, el diálogo sigue visible 500 ms después de abrirse y "Agregar al carrito" añade el producto.

#### I5. Los bordes de los campos de formulario no alcanzan el contraste mínimo para no-texto (WCAG 1.4.11)
- **Archivo:** `src/styles/global.css:279` (`.input { border: 1.5px solid #cfc6e6 }` sobre `#fff`) y `:293` (`.qty`, mismo color).
- **Fallo:** el ratio de `#cfc6e6` sobre `#ffffff` es **1,63:1** (mínimo 3:1). Los campos (nombre, teléfono, ciudad, dirección, notas, modelo de celular, cantidad, búsqueda) son blancos dentro de cajas blancas, así que el borde es lo único que los delimita. Para personas con baja visión, los campos son casi invisibles.
- **Cómo reproducir:** `python3 /home/claude/audit/contrast.py`, o cualquier herramienta de contraste sobre `#/pedido`.
- **Corrección:** usar un borde de al menos `#8f86ad` (≈ 3,4:1) o reutilizar `--muted` (`#565072`, 7,5:1) para `.input` y `.qty`.
- **Prueba que debe superar:** una comprobación automatizada (axe-core o un script de contraste) de que el color del borde de `.input` y `.qty` frente al fondo efectivo es ≥ 3:1.

#### I6. El menú móvil no gestiona el foco y puede quedar abierto con el scroll bloqueado
- **Archivo:** `src/ui/components/Layout.tsx:25-37` (efectos de apertura y cierre del menú) y `:72` (`hidden={!open}`).
- **Fallo (verificado a 390 px):**
  1. Al pulsar `Escape`, el menú se oculta pero el foco se queda en un enlace dentro del menú oculto (`activeElement` = `<a>` oculto). No vuelve al botón "Abrir menú", y el usuario de teclado o lector de pantalla pierde su posición.
  2. Con el menú abierto, tras 14 `Tab` el foco sale al contenido de fondo ("Ver retablos desde…"), que no está visible porque el scroll está bloqueado. No hay trampa de foco.
  3. Si se pulsa en el menú el enlace de la página actual (por ejemplo "Contacto" estando en `#/contacto`), no hay `hashchange`, el menú sigue abierto y `body.no-scroll` se mantiene. Visualmente parece que el enlace no funciona.
- **Cómo reproducir:** a 390 px, abrir el menú y pulsar `Escape` → `document.activeElement` es un enlace oculto. Abrir el menú en `#/contacto` y pulsar "Contacto" → el menú no se cierra.
- **Corrección:**
  - Al cerrar, devolver el foco al botón del menú.
  - Contener el foco dentro del menú mientras está abierto, o marcar el resto como `inert`.
  - Cerrar el menú en el `onClick` de cada enlace, no solo cuando cambia la ruta.
- **Prueba que debe superar:** una e2e móvil en la que, tras `Escape`, el foco está en `button[aria-controls="menu-movil"]`. Con el menú abierto, 30 `Tab` no sacan el foco de `#menu-movil` ni del botón. Al pulsar el enlace de la página actual, el menú se cierra y `body` no tiene `no-scroll`.

### 3.3 Mejoras recomendadas

#### M1. `restoreCart` acepta ids de línea duplicados
- **Archivo:** `src/domain/cart.ts:158`.
- **Fallo:** un carrito manipulado con dos líneas `id:'dup'` hace que "+" cambie las dos líneas a la vez: los subtotales pasan de $24.000/$3.000 a $36.000/$9.000 (verificado), y `key` se duplica en React.
- **Corrección:** regenerar el id si ya se usó y fusionar líneas equivalentes.
- **Prueba:** una unitaria en la que `restoreCart` con ids repetidos devuelve ids únicos.

#### M2. El subtotal del diálogo no se actualiza mientras se escribe la cantidad
- **Archivo:** `AddToCartDialog.tsx:114-115` con `QuantityInput` (confirma la cantidad al perder el foco).
- **Fallo:** al escribir "25" se sigue viendo "Subtotal: $12.000" hasta salir del campo. Al agregar, sí se guarda 25 (verificado).
- **Corrección:** calcular el subtotal con el borrador validado, o confirmar la cantidad en `onChange` cuando es un número válido.
- **Prueba:** una e2e que escribe 25 y espera "$300.000" antes del `blur`.

#### M3. El README enlaza `docs/AUDITORIA.md`, que no existe
- **Archivo:** `README.md:85`.
- **Fallo:** el enlace afirma que existe un "informe de auditoría y resultados de pruebas".
- **Corrección:** eliminar el enlace o añadir el informe real.
- **Prueba:** un verificador de enlaces del README sin enlaces rotos.

#### M4. Textos no respaldados por la fuente o inexactos
- **Archivos y fallos:**
  - `products.ts:175` e `InfoPages.tsx:168`: "El precio depende del diseño y la cantidad". El PDF solo dice "Ideales para todo tipo de ocasión".
  - `InfoPages.tsx:153`: "coordinar una visita". Sugiere un local que se puede visitar, algo que no está confirmado.
  - `InfoPages.tsx:163`: "En el carrito puedes… elegir una imagen de referencia". En el carrito no se puede elegir ni cambiar la imagen, solo en el diálogo de agregar.
- **Corrección:** ajustar los textos a datos confirmados.
- **Prueba:** revisión de contenidos con el cliente.

#### M5. Los logos y el póster muestran `@sincelejo_retablo15` (sin "s")
- **Archivos:** `public/images/brand/*`, `og-image.jpg`. Los enlaces usan `@sincelejo_retablos15`, que coincide con el PDF y con el requisito.
- **Fallo:** el usuario ve dos cuentas distintas. Está documentado en el README, pero sin resolver.
- **Corrección:** confirmarlo con el cliente y corregir el arte o el texto.

#### M6. La maqueta ilustrativa del pendón 50×70 muestra un precio ajeno
- **Archivo:** `pendon-50x70-*.webp`.
- **Fallo:** la imagen muestra "COMBO DESAYUNO $15.000" junto al precio oficial de $25.000 y puede confundir. Viene así en el PDF y está marcada como "Imagen ilustrativa".
- **Corrección:** valorar recortarla o difuminar el precio.

#### M7. Saltos de línea y formato de WhatsApp en campos del cliente
- **Archivos:** `whatsappOrderChannel.ts:25` (`phoneModel`), `:39` (`address`, `city`), `:28` (`referenceImageName`). `sanitizeText` conserva `\n`.
- **Fallo:** con `localStorage` manipulado, `phoneModel: 'X\n*Total de productos:* $1'` inserta una línea falsa en el mensaje. Tampoco se neutralizan `*`, `_` y `~`. El impacto es bajo, porque el cliente puede editar el texto en WhatsApp de todos modos, pero conviene que el mensaje generado sea canónico.
- **Corrección:** convertir a una sola línea todos los campos salvo los que se tratan explícitamente.
- **Prueba:** una unitaria con `\n` en todos los campos que verifique que el número de líneas del mensaje es el esperado.

#### M8. Despliegue y SEO
- **Archivos y fallos:**
  - `ci-deploy.yml:14`: `cancel-in-progress: true` en el grupo que incluye el despliegue puede cancelar un despliegue de Pages a medias. GitHub recomienda `false` para Pages.
  - `ci-deploy.yml:30`: `VITE_SITE_URL` es incorrecta si el repositorio es `usuario.github.io` o si se usa un dominio propio. Conviene `${{ steps.pages.outputs.base_url }}` (`actions/configure-pages`) o una variable de repositorio.
  - `index.html:17`: `og:image` queda relativo (`./og-image.jpg`) cuando `VITE_SITE_URL` está vacía.
  - Faltan `og:url`, `<link rel="canonical">` y, en el JSON-LD, `url`, `logo` e `image`.
- **Prueba:** un build en CI con `grep` que confirme que `og:image` empieza por `https://`, y una validación del JSON-LD.

#### M9. `useDocumentTitle` no restablece la meta `description`
- **Archivo:** `useDocumentTitle.ts:7`.
- **Fallo:** las páginas sin descripción propia (carrito, pedido, FAQ, seguimiento) heredan la de la página anterior.
- **Corrección:** restablecer la descripción por defecto.
- **Prueba:** una e2e que navega de `#/contacto` a `#/preguntas-frecuentes` y comprueba la descripción.

#### M10. El carrito no se sincroniza entre pestañas
- **Archivo:** `CartContext.tsx:55`.
- **Fallo:** no hay un listener de `storage`. Una pestaña con un estado antiguo sobrescribe el carrito de otra en su próximo cambio.
- **Prueba:** una e2e con dos páginas en el mismo contexto.

#### M11. Validación incoherente del modelo de celular
- **Archivo:** `CartPage.tsx:62-67`.
- **Fallo:** el diálogo exige al menos 2 caracteres, pero en el carrito basta con 1 y `missingRequiredFields` lo acepta. Además, el carrito no muestra un mensaje de error junto al campo (solo `aria-invalid`).
- **Corrección:** aplicar la misma regla en el dominio.

#### M12. `httpPaymentGateway.getStatus` devuelve cualquier `status` del servidor sin validarlo
- **Archivo:** `httpPaymentGateway.ts:32-33`.
- **Corrección:** validarlo contra la lista de `PaymentStatus` antes de activar la fase 2.
- **Prueba:** una unitaria con `{status:'hackeado'}` que devuelva `'error'`.

#### M13. "14 medidas de retablo" está escrito a mano
- **Archivo:** `HomePage.tsx:51`.
- **Fallo:** si cambia el catálogo, el dato queda desactualizado.
- **Corrección:** derivarlo de `products`.

#### M14. Huecos en las pruebas
- **Fallo:** la e2e de desbordamiento (`tienda.spec.ts:190`) no detecta contenido recortado por `overflow: hidden` (de ahí que no detectara C1). No hay pruebas de `parseHash` con entradas malformadas, de `loadLast` corrupto, ni del diálogo con `StrictMode`.
- **Corrección:** añadir las pruebas indicadas en C1, I1, I2 e I4.

#### M15. El botón flotante de WhatsApp tapa contenido en móvil
- **Archivo:** `global.css:405` (`.wa-fab`).
- **Fallo:** a 360 px tapa texto, por ejemplo la ayuda del paso 4 en `#/seguimiento` (captura `shots/360-__seguimiento.png`).
- **Corrección:** añadir `padding-bottom` de unos 80 px al `main` o al pie en móvil.

---

## 4. Verificado sin hallazgos

- **Precios:**
  - Los 14 retablos, 2 forros, llavero, polaroid, 5 pendones, 2 tarjetas de presentación y 2 stickers coinciden con el PDF y con el requisito (prueba unitaria, e2e y revisión manual).
  - Las tarjetas personalizadas no tienen precio (cotización) y no suman al total.
  - Las 6 líneas futuras no tienen precio ni botón de compra.
  - Las unidades se distinguen bien: unidad, paquete de 100 y millar.
- **Imágenes frente al PDF:**
  - Cada foto de retablo corresponde a su medida (20×20 playa, 30×30 "Alaia", 40×40 familia, 60×60 globos, 100×100 bebé "Juan", 10×15 grado, 15×20 quinceañera, 20×30 "Chicha", 30×40 Nike/Jordan, 40×50 familia, 40×60 niña rosada, 50×70 playa, 60×80 quince años, 100×120 imagen religiosa).
  - Forros: glitter = Virgen rosada; brillante = forros en abanico.
  - Pendones: 50×70 café, 70×100 spa, 90×120 Urbano, 100×150 Travel, 120×180 Music Festival.
  - Tarjetas de presentación: una cara = Caffè Luna; doble cara = "G" verde.
  - Pendones, tarjetas de presentación y el sticker "Cosmic Bites" están marcados como "Imagen ilustrativa".
- **WhatsApp:**
  - `https://wa.me/573013804470?text=…` con un único parámetro.
  - `&`, `#`, `%`, `"`, emojis, `?text=` y saltos de línea se codifican correctamente (la vista previa es idéntica al texto decodificado).
  - El mensaje incluye referencia, nombre, teléfono opcional, productos, variantes, cantidades, unitarios con unidad, subtotales, total, "+ productos por cotizar", "Envío: pendiente de cotización", dirección y ciudad solo para domicilio, instrucciones, modelo de celular e imagen de referencia.
  - No afirma que el pedido esté registrado ni pagado.
- **Instagram y teléfono:** `https://www.instagram.com/sincelejo_retablos15/` y `tel:+573013804470`. Los enlaces externos llevan `target="_blank" rel="noopener noreferrer"`.
- **Carrito:**
  - Agregar, variantes, +/−, entrada numérica de 1 a 999 (−5→1, 2,7→2, "1e9"→1, "abc"→1), eliminar, vaciar con confirmación, estado vacío, subtotales y total correctos.
  - El envío nunca se suma al total.
  - Persistencia de 7 días con tolerancia a `localStorage` bloqueado.
  - Un precio inyectado en `localStorage` se ignora y los productos inexistentes se descartan.
- **Validaciones:**
  - Nombre obligatorio (con foco en el primer error).
  - Teléfono colombiano opcional.
  - Ciudad y dirección obligatorias solo para domicilio.
  - Modelo de celular obligatorio para forros.
  - Imagen de referencia validada por tipo (JPG/PNG/WEBP/HEIC) y tamaño (≤ 10 MB); el PDF se rechaza.
- **Seguridad:**
  - No se usa `dangerouslySetInnerHTML`, `innerHTML` ni `eval`. Las cadenas XSS se muestran escapadas.
  - No hay secretos en los archivos versionados.
  - `.gitignore` excluye `.env*` salvo `.env.example`.
  - `.env.example` solo tiene variables públicas, con las claves de servidor comentadas.
  - `npm audit`: 0 vulnerabilidades.
- **Pagos:** solo preparados (puerto, adaptador "no disponible" activo, adaptador HTTP que envía solo ids y cantidades). No se simulan pagos y `docs/PAGOS.md` es coherente con el código.
- **Datos no inventados:** dirección exacta, horarios, correo y tiempos de producción están en `null` y no se muestran. La ubicación se limita a "Barrio El Recreo, Sincelejo, Sucre".
- **Responsive:** las 14 rutas a 360, 768 y 1366 px no tienen desbordamiento horizontal de página (aparte de C1). La consola del navegador no muestra errores ni avisos.
- **Accesibilidad:**
  - Un `h1` por página, sin ids duplicados, sin `aria-describedby` rotos, todas las imágenes con `alt` y botones y enlaces con nombre accesible.
  - Enlace "Saltar al contenido". El diálogo nativo se cierra con `Escape`.
  - El foco es visible en el campo de archivo al navegar con teclado.
  - Contraste de texto ≥ 4,5:1 en todos los pares medidos (el mínimo es magenta sobre `#efeaf9`: 4,61:1).
- **Rendimiento:** 89,5 kB de JS en gzip. Las imágenes de 480 px pesan como máximo 68 kB y se usa `srcset` con `loading="lazy"`. En la portada a 1366×800 se piden 11 imágenes, todas de 480 px o el póster de 560 px.
- **GitHub Pages:**
  - `base: './'`, `.nojekyll` y enrutado por hash sin errores 404 al recargar.
  - Permisos mínimos en el workflow. El despliegue solo ocurre en `main` y no en *pull requests*, y depende de que pasen typecheck, pruebas unitarias, build y e2e.
- **Arquitectura:** hexagonal ligera, coherente con `docs/ARQUITECTURA.md`. El dominio no depende de React y el catálogo es la única fuente de precios.
