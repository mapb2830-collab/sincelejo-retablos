# Sincelejo Retablos · Tienda web

Tienda web de **Sincelejo Retablos** (Barrio El Recreo, Sincelejo, Sucre, Colombia): catálogo con precios oficiales,
carrito de compras y pedidos por WhatsApp. Preparada para incorporar pagos en línea en una segunda fase.

## Estado de la primera entrega

| Función | Estado |
| --- | --- |
| Catálogo con los precios oficiales del PDF (8 categorías) | ✅ Terminado |
| Filtros por categoría y búsqueda por nombre o medida | ✅ Terminado |
| Carrito: agregar, cantidades, eliminar, vaciar, subtotales y total, guardado 7 días en el navegador | ✅ Terminado |
| Personalización: instrucciones, modelo de celular (forros), imagen de referencia validada | ✅ Terminado (la imagen se envía por WhatsApp, no se sube) |
| Pedido por WhatsApp con resumen completo (wa.me/573013804470) | ✅ Terminado |
| Seguimiento inicial del último pedido preparado (en el navegador del cliente). Abrir WhatsApp no cuenta como enviado: el cliente lo declara con "Ya envié el mensaje" | ✅ Terminado |
| Novedades: vasos, mugs, forrado de paredes y objetos, promocionales | ✅ Sección preparada, **sin precio ni disponibilidad** |
| Pagos en línea (Wompi / Mercado Pago) | ⏳ **No implementado.** Arquitectura y contrato listos: ver [docs/PAGOS.md](docs/PAGOS.md) |
| Registro de pedidos en un servidor, confirmación por el negocio | ⏳ Fase 2 (requiere backend) |

## Requisitos

- Node.js 20.19 o superior (probado con Node 22) y npm.
- Google Chrome para ver la página.

## Comandos

```bash
npm install            # instalar dependencias
npm run dev            # servidor de desarrollo → http://localhost:5173
npm run build          # compilación de producción en dist/
npm run preview        # sirve dist/ → http://localhost:4173
npm test               # pruebas unitarias (Vitest)
npx playwright install chromium   # solo la primera vez, para pruebas de navegador
npm run test:e2e       # pruebas en Chrome escritorio y móvil (Playwright; requiere `npm run build` antes; levanta preview y dev)
npm run test:all       # tipos + unitarias + build + navegador
```

Abre **http://localhost:5173** en Chrome después de `npm run dev`. El puerto está fijado en `vite.config.ts`
(`strictPort`): si está ocupado, Vite mostrará un error en lugar de cambiar de puerto en silencio.

## Variables de entorno

Copia `.env.example` como `.env.local`. Ninguna es obligatoria para la fase 1.

| Variable | Uso | Por defecto |
| --- | --- | --- |
| `VITE_WHATSAPP_NUMBER` | Número de pedidos, formato internacional sin `+` | `573013804470` |
| `VITE_SITE_URL` | URL pública (vista previa al compartir enlaces) | vacío |
| `VITE_PAYMENTS_ENABLED` | Activa el adaptador de pagos (fase 2) | `false` |
| `VITE_ORDERS_API_URL` | URL del backend de pedidos y pagos (fase 2) | vacío |

Todo lo que empieza por `VITE_` es **público** (termina en el navegador). Las claves privadas de la pasarela
van **solo** en el servidor de la fase 2, nunca en este repositorio.

## ¿Dónde se cambia cada cosa?

| Quiero cambiar… | Archivo |
| --- | --- |
| Un precio, una medida, una descripción o un producto | `src/catalog/products.ts` (único lugar con precios) |
| Las categorías y las líneas futuras (novedades) | `src/catalog/categories.ts` |
| Fotos de productos | `public/images/products/<categoría>/` (ver [docs/CATALOGO.md](docs/CATALOGO.md)) |
| Logos | `public/images/brand/`, `public/favicon.png`, `public/og-image.jpg` |
| Teléfono, Instagram, ubicación, formas de pago | `src/config/business.ts` |
| Texto del mensaje de WhatsApp | `src/adapters/whatsapp/whatsappOrderChannel.ts` |
| Colores y tipografía | `src/styles/global.css` (variables en `:root`) |

La prueba `tests/unit/catalog.test.ts` contiene los precios oficiales. Si cambias un precio a propósito,
actualízalo también allí: así ningún precio cambia por accidente.

## Publicación

- **GitHub Pages:** el flujo `.github/workflows/ci-deploy.yml` ejecuta tipos, pruebas, build y pruebas en Chrome, y publica
  `dist/` en cada push a `main`. Hay que activar Pages en *Settings → Pages → Source: GitHub Actions*.
- El sitio usa rutas con `#` (por ejemplo `#/catalogo/retablos`) y rutas de recursos relativas, así que funciona en
  `usuario.github.io/repositorio/` sin configuración adicional.
- GitHub Pages solo sirve archivos estáticos. **No** sirve para procesar pagos: ver [docs/PAGOS.md](docs/PAGOS.md).

Para actualizar la página: edita, ejecuta `npm run test:all`, haz commit y `git push`. El flujo vuelve a publicar.

## Documentación

- [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md): decisión de arquitectura y estructura de carpetas.
- [docs/CATALOGO.md](docs/CATALOGO.md): cómo agregar productos, precios e imágenes.
- [docs/PAGOS.md](docs/PAGOS.md): plan de integración de pagos (fase 2).
- [docs/AUDITORIA.md](docs/AUDITORIA.md): informe de auditoría y resultados de pruebas.

## Datos pendientes de confirmar por el negocio

Dirección exacta, horarios, correo, tiempos de producción, política de devoluciones y cobertura de envíos no
aparecen en el catálogo. Están como `null` en `src/config/business.ts` y la página no los muestra hasta que se definan.
El usuario de Instagram aparece como `@sincelejo_retablos15` en el catálogo y como `@sincelejo_retablo15` en los logos nuevos:
la página usa el del catálogo hasta confirmarlo.
