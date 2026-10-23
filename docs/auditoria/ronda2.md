# Auditoría técnica independiente · Ronda 2

**Proyecto:** `/home/claude/sincelejo-retablos` · **Commit auditado:** `7120828` ("Corrige hallazgos de la auditoría (ronda 1)"), comparado con `94fa824`
**Fecha:** 2026-10-23 · **Auditor:** Agente 2. Solo lectura: no modifiqué el proyecto (`git status` limpio).

Mis scripts y capturas están en `/home/claude/audit/` (`r2-*.mjs`, `browser5.mjs`, `browser6.mjs`, `shots/r2-*`). Para comparar con la versión anterior construí el commit `94fa824` en `/home/claude/audit/old`.

---

## 1. Resumen y veredicto

## Veredicto: **NO APROBADO**

Verifiqué con pruebas propias que se corrigieron el error crítico **C1** y los seis importantes **I1–I6** de la ronda 1. No encontré regresiones por los cambios.

Queda **1 error importante nuevo**, que ya existía en la versión anterior y no detecté en la ronda 1: al cerrar el diálogo "Agregar al carrito", el foco del teclado se pierde y va a `<body>`. Es la misma clase de defecto que I6 (menú móvil), que sí se corrigió. Por eso, con el mismo criterio de la ronda 1, el veredicto no puede ser APROBADO. La corrección es pequeña.

| Categoría | Ronda 1 | Ronda 2 (abiertos) |
| --- | --- | --- |
| Errores críticos | 1 | **0** |
| Errores importantes | 6 | **1** (nuevo: I7) |
| Mejoras recomendadas | 15 | **6** (M3, M5 y M7 parcial, de la ronda 1; M16–M18, nuevas) |

---

## 2. Pruebas ejecutadas (comando → resultado)

| # | Comando / prueba | Resultado |
| --- | --- | --- |
| 1 | `npm run typecheck` | OK (exit 0) |
| 2 | `npm test` | 6 archivos, **48/48 pruebas superadas** (antes 32) |
| 3 | `npm run build` | OK. JS 303,04 kB (91,33 kB gzip), CSS 33,15 kB (9,58 kB gzip). Regeneró `dist/`, que está en `.gitignore` |
| 4 | `npm run test:e2e` (levanta preview en 4173 y dev en 5173) | **30 superadas, 4 omitidas** (omisiones por diseño: escritorio o móvil), 0 fallidas |
| 5 | `npm audit` | `found 0 vulnerabilities` |
| 6 | `browser6.mjs`: tarjetas con selector a 360, 700, 768, 900, 1024, 1366 y 1920 px | **0 elementos recortados**. Tarjeta de 720 px a 768 y de 980 px desde 1366 (antes 349/369 px) |
| 7 | `r2-browser3.mjs`: hash malformado, `localStorage` corrupto, carrito manipulado, flujo completo y WhatsApp, seguimiento, menú móvil, accesibilidad | Ver §3.4 (todo corregido) |
| 8 | `browser5.mjs`: diálogo en servidor de desarrollo (`vite --port 5175`, StrictMode) | Abierto a 0, 50, 200 y 600 ms (antes se cerraba) |
| 9 | `r2-browser7.mjs`: cierre del diálogo (X, Escape, envío) en preview y en dev, la página sigue interactiva, cantidad escrita en el carrito, botón flotante en móvil | Sin regresiones; cantidad en vivo correcta; el botón flotante ya no tapa contenido |
| 10 | `r2-focus.mjs`: foco tras cerrar el diálogo, versión 94fa824 frente a 7120828 | Foco en `BODY` en **ambas** versiones → I7 |
| 11 | Build con `VITE_SITE_URL=https://usuario.github.io/sincelejo-retablos` hacia `/home/claude/audit/dist-prod` | `og:url`, `canonical`, `og:image` y JSON-LD (`url`, `logo`, `image`) absolutos; el JSON-LD se parsea bien |
| 12 | `contrast.py` | Borde de campos `#857ca3`: 3,88:1 sobre blanco y 3,29:1 sobre `#efeaf9` (mínimo 3:1) |
| 13 | Revisión visual de `pendon-50x70-900.webp` y capturas `r2-1366-stickers`, `r2-768-forros` | Precio ajeno difuminado; tarjetas completas |

Al terminar detuve por PID los servidores auxiliares (4174, 4175 y 5175).

---

## 3. Hallazgos

### 3.1 Errores críticos

Ninguno.

### 3.2 Errores importantes

#### I7 (nuevo; ya existía en 94fa824). Al cerrar el diálogo "Agregar al carrito", el foco se pierde
- **Archivo:** `src/ui/components/AddToCartDialog.tsx:25-31` (efecto que abre el diálogo, sin restauración de foco) y `:46` (`onClose`/`onCancel` desmontan el `<dialog>`). Lo usan `src/ui/components/ProductCard.tsx` (`VariantCard` y `SelectorCard`, `setOpen(false)`).
- **Fallo:** el diálogo se cierra desmontándolo, y en ninguna de las dos versiones se devuelve el foco al botón que lo abrió. Tras cerrar con X, con "Agregar al carrito" o con `Escape`, `document.activeElement` es `<body>`. Quien navega con teclado o lector de pantalla vuelve al principio del documento y pierde su posición en el catálogo (WCAG 2.4.3, orden del foco). Es el mismo defecto que se corrigió en el menú móvil (I6).
- **Cómo reproducir:** `node /home/claude/audit/r2-focus.mjs` con preview en 4174. Manualmente: en `#/catalogo/llaveros`, enfocar "Agregar al carrito", pulsar `Enter`, cerrar con `Escape`, X o enviando, y comprobar `document.activeElement` → `BODY`.
- **Corrección:**
  - Guardar el elemento que tenía el foco al abrir (`document.activeElement`) y devolverlo con `.focus()` al cerrar, por ejemplo en un `useEffect` de limpieza (seguro en StrictMode, porque no llama a `close()`) o en el `onClose` del padre.
  - Si el botón cambió, usar como alternativa el botón "Agregar" de la tarjeta.
- **Prueba que debe superar:** una e2e de escritorio que, para los tres modos de cierre (X, `Escape` y envío), compruebe que el foco vuelve al botón "Agregar…" de la misma tarjeta (`toBeFocused()`). Debe pasar contra preview y contra dev (StrictMode).

### 3.3 Mejoras recomendadas (abiertas)

| ID | Estado | Archivo / ubicación | Descripción y corrección |
| --- | --- | --- | --- |
| M3 | **No corregido** (acordado para después) | `README.md:85` | Sigue enlazando `docs/AUDITORIA.md`, que no existe. Crearlo con el informe final o quitar el enlace. Prueba: verificador de enlaces del README. |
| M5 | **No corregido** (depende del cliente) | `public/images/brand/*`, `og-image.jpg` | Los logos muestran `@sincelejo_retablo15`; los enlaces usan `@sincelejo_retablos15`. Pendiente de confirmar con el cliente. |
| M7 | **Parcialmente corregido** | `src/domain/cart.ts:268-271` (`sanitizeLine`), `src/adapters/whatsapp/whatsappOrderChannel.ts` | Corregido lo esencial: los saltos de línea ya no insertan líneas falsas (unitaria `order.test.ts:91`). Pendiente menor: `*`, `_` y `~` de los textos del cliente siguen aplicando formato en WhatsApp (por ejemplo, un nombre `*Total…*` se ve en negrita). Opcional: neutralizarlos, por ejemplo con un espacio de ancho cero tras el símbolo. |
| M16 (nuevo) | Abierto | `docs/ARQUITECTURA.md:33` y `:50-51` | La documentación cita `markSentToBusiness`, que ya no existe (ahora `markWhatsAppOpened` y `markSentByCustomer`), y no explica que "enviado al negocio" ahora lo **declara el cliente** y que abrir WhatsApp solo anota `whatsappOpenedAt`. Actualizarla. |
| M17 (nuevo, riesgo de despliegue no verificable aquí) | Abierto | `.github/workflows/ci-deploy.yml:9-10` y `:28-30` | `actions/configure-pages@v5` se ejecuta en `test-build`, que hereda `permissions: contents: read` (sin `pages`). La API `GET /repos/{o}/{r}/pages` es pública en repositorios públicos, así que lo normal es que funcione. Pero en un repositorio privado (o con políticas de token restrictivas) fallará el paso, fallará el build de `main` y **no se desplegará**. No puedo ejecutar GitHub Actions aquí. Corrección de una línea: `permissions: { contents: read, pages: read }` en el job `test-build`. Prueba: un push a `main` con el workflow en verde y la URL de Pages correcta en `og:url`. |
| M18 (nuevo, menor) | Abierto | `src/ui/pages/CheckoutPage.tsx:55-66` y `:206` (botón "Ver seguimiento del pedido") | El pedido solo se guarda al pulsar "Abrir WhatsApp". Si el cliente pulsa "Ver seguimiento del pedido" justo después de preparar el mensaje, Seguimiento dice "Aún no has preparado un pedido en este navegador", aunque acaba de prepararlo. Guardarlo al prepararlo (estado `carrito-preparado`) o ajustar el texto. Además, en builds locales sin `VITE_SITE_URL`, el JSON-LD conserva `"logo": "./images/..."` e `"image": "./og-image.jpg"` relativos (no válidos para schema.org): eliminarlos igual que `url`. Por último, el `ErrorBoundary` solo envuelve `<main>`: un error en el encabezado o en el pie seguiría dejando la página en blanco (riesgo bajo). |

### 3.4 Estado de cada hallazgo de la ronda 1

| ID | Estado | Evidencia propia |
| --- | --- | --- |
| **C1** | **Corregido** | `browser6.mjs`: 0 recortes en 6 categorías × 7 anchos. Precios "$25.000" y "$30.000" visibles completos (capturas `r2-1366-stickers.png` y `r2-768-forros.png`). Nueva e2e `tienda.spec.ts:230` que lo cubre. |
| **I1** | **Corregido** | `#/catalogo/%E0%A4%A` (carga completa y `hashchange`) muestra "No encontramos esta página" sin `pageerror`. Hay `try/catch` en `router.ts`, `ErrorBoundary` en `App.tsx`, una unitaria y una e2e. |
| **I2** | **Corregido** | Con 3 variantes corruptas en `sr.lastOrder.v1`, Seguimiento muestra "Aún no has preparado un pedido…" sin errores. `isValidOrderSnapshot` es exhaustivo (tipos, importes finitos, cantidades 1-999, estado de `ORDER_FLOW`, cliente) y borra la clave inválida. |
| **I3** | **Corregido** | Tras abrir WhatsApp: el aviso "¿Enviaste el mensaje?" está visible y Seguimiento dice "Estado: Carrito preparado". Tras "Ya envié el mensaje" dice "Estado: Pedido enviado al negocio (según indicaste)", y se mantiene al recargar. |
| **I4** | **Corregido** | En dev (StrictMode) el diálogo sigue abierto y agrega al carrito. Cerrarlo con X, `Escape` o envío no deja la página inerte (búsqueda y enlaces siguen operativos, sin errores). Hay una e2e `dev.spec.ts` y una unitaria con StrictMode. |
| **I5** | **Corregido** | `--field-border: #857ca3`: 3,88:1 sobre blanco y 3,29:1 sobre `#efeaf9`. |
| **I6** | **Corregido** | `Escape` devuelve el foco al botón del menú. 14 o más `Tab` se quedan dentro del menú o en su botón. El enlace de la página actual cierra el menú y quita `no-scroll`. |
| M1 | Corregido | Con ids repetidos, "+" ya solo cambia una línea ($36.000 / $3.000). |
| M2 | Corregido | El subtotal se actualiza mientras se escribe, en el diálogo y en el carrito (25 → $300.000). Con "0" y salida del campo se corrige a 1. Con 999 el botón + queda deshabilitado. |
| M3 | No corregido (pendiente acordado) | — |
| M4 | Corregido | Los textos de tarjetas personalizadas, contacto y la pregunta frecuente de la imagen ya no afirman nada sin respaldo. |
| M5 | No corregido (depende del cliente) | — |
| M6 | Corregido | Revisión visual: el "$15.000" está difuminado. |
| M7 | Parcialmente corregido | Ver §3.3. |
| M8 | Corregido (con la observación M17) | `cancel-in-progress: false`. `base_url` sale de `configure-pages`. Con URL, `og:url`, `canonical`, `og:image` y JSON-LD son absolutos y válidos. Sin URL se omiten `og:url`, `canonical` y `url`. |
| M9 | Corregido | Las páginas sin descripción propia vuelven a la descripción general (e2e). |
| M10 | Corregido | El listener de `storage` funciona (la e2e entre pestañas pasa) y no reescribe lo recibido de otra pestaña. |
| M11 | Corregido | `isValidPhoneModel` es la regla única para el diálogo, el carrito y `missingRequiredFields`; el carrito muestra el mensaje de error con `aria-describedby`. |
| M12 | Corregido | `getStatus` solo acepta estados conocidos (unitaria). |
| M13 | Corregido | El número de medidas se calcula desde `products`. |
| M14 | Corregido | Hay pruebas nuevas para C1, I1, I2, I3, I4, I6, M2, M9 y M10. |
| M15 | Corregido | A 360 px, al final de seguimiento, contacto, preguntas frecuentes y novedades, el botón flotante no tapa ningún texto ni control (`main` con `padding-bottom` de 72 px). |

---

## 4. Regresiones buscadas y verificado sin hallazgos

- **Sin regresiones** en precios: siguen pasando la unitaria del catálogo oficial y la e2e de las 14 medidas.
- **Mensaje de WhatsApp:** contenido idéntico al de la ronda 1, bien codificado (`&`, `#`, `%`, `"`, emojis, `?text=`), y la vista previa coincide con el texto decodificado.
- **Carrito y validaciones:** totales, envío no sumado, validaciones de nombre, teléfono y modelo, y foco en el primer error.
- **Cierre del diálogo sin `close()`:** no deja `inert` ni bloquea la página, ni en preview ni en dev.
- **`QuantityInput` en vivo:** no produce saltos al escribir. Los valores vacíos o "0" se corrigen al salir del campo.
- **Rutas:** a 360, 768 y 1366 px sigue sin haber desbordamiento horizontal ni errores de consola.
- **Accesibilidad básica:** un `h1` por página, sin ids duplicados, `aria-describedby` válidos, `alt` en todas las imágenes y nombres accesibles.
- **`ErrorBoundary`:** se reinicia al cambiar de ruta (`resetKey`) y ofrece un enlace a WhatsApp.
- **Seguridad:** sin secretos nuevos y `npm audit` con 0 vulnerabilidades. No hay `dangerouslySetInnerHTML`. Las cadenas XSS en `localStorage` se descartan o se muestran escapadas.
- **Rendimiento:** el JS crece solo 1,8 kB en gzip. La portada sigue pidiendo 11 imágenes ligeras con `lazy`.
- **`playwright.config.ts`:** el segundo `webServer` (`npm run dev` en 5173) funciona en local; en CI usa `reuseExistingServer: false` con puertos fijos sin conflicto.
