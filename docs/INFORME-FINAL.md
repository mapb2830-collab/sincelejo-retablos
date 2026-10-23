# Informe final · Primera entrega

**Proyecto:** tienda web de Sincelejo Retablos · **Fecha:** 2026-10-23 · **Commit aprobado:** `b8951aa` (+ `200fc41` y este informe, solo documentación)

## 1. Resumen de lo construido

Tienda navegable con el catálogo oficial (8 categorías, 31 precios), fotos reales del catálogo, carrito funcional,
preparación de pedidos por WhatsApp, seguimiento inicial, novedades sin precio, empresa, contacto y preguntas frecuentes.
Funciona en móvil, tableta y escritorio.

## 2. Tecnologías y justificación

Vite 8 + React 19 + TypeScript (estricto), sin librerías de UI ni de estado. Sitio estático publicable gratis en GitHub Pages.
Vitest para reglas de negocio y Playwright para pruebas reales en Chrome. Detalle en [ARQUITECTURA.md](ARQUITECTURA.md).

## 3. Arquitectura

Hexagonal ligera (puertos y adaptadores) en lugar de MVC: dominio puro (carrito, pedido, pagos), casos de uso, y adaptadores
para WhatsApp, almacenamiento local y pagos. Así se cambia WhatsApp o se agrega una pasarela sin tocar la interfaz.

## 4. Catálogo implementado

Todo en `src/catalog/products.ts`, única fuente de precios, y protegido por la prueba `tests/unit/catalog.test.ts`:
- **Retablos:** 5 medidas cuadradas y 9 rectangulares.
- **Forros:** glitter y brillante.
- **Llavero y foto polaroid.**
- **Pendones:** 5 medidas.
- **Tarjetas de presentación:** millar a una cara y a doble cara.
- **Stickers:** paquetes de 100, sin laminar y laminados.
- **Tarjetas personalizadas:** por cotización.
- **Líneas futuras:** 6, sin precio.

Las maquetas genéricas del catálogo se muestran con la etiqueta "Imagen ilustrativa", y el precio ajeno que aparecía en una de ellas se difuminó.

## 5. Funcionalidades terminadas

- **Catálogo:** filtros por categoría y búsqueda por nombre o medida.
- **Carrito:** agregar, cambiar cantidades (1 a 999), eliminar y vaciar. Muestra subtotales y total, se conserva 7 días, se sincroniza entre pestañas y tiene estado vacío. El envío figura como "pendiente de cotización" y no se suma.
- **Personalización:** instrucciones de diseño, modelo de celular obligatorio en los forros e imagen de referencia validada (JPG, PNG, WEBP o HEIC, hasta 10 MB). La imagen no se sube: se envía por WhatsApp.
- **Pedido por WhatsApp:** valida los datos y arma el resumen completo con referencia `SR-AAMMDD-XXXX`. El enlace `wa.me/573013804470` va correctamente codificado.
- **Estados honestos:**
  - El pedido queda como "carrito preparado" al armarlo.
  - Abrir WhatsApp no cuenta como envío.
  - El estado pasa a "enviado (según indicaste)" solo cuando el cliente lo declara.
  - "Confirmado por el negocio" y "pago confirmado" quedan reservados al backend de la fase 2.
- **SEO y accesibilidad:** metadatos SEO y para compartir, JSON-LD, accesibilidad por teclado y foco, contraste revisado e imágenes WebP con carga diferida.

## 6. Funcionalidades pendientes

- Pagos en línea (Wompi o Mercado Pago): **no implementados**. La arquitectura y el contrato del backend están listos en [PAGOS.md](PAGOS.md).
- Registro de pedidos en un servidor y confirmación del pedido por parte del negocio (fase 2).
- Publicación en GitHub y GitHub Pages: bloqueada hasta tener permiso de escritura en el repositorio.
- Datos del negocio sin confirmar: dirección exacta, horarios, correo, tiempos de producción y políticas. Mientras tanto no se muestran.
- Confirmar el usuario de Instagram: el catálogo dice `@sincelejo_retablos15` y los logos dicen `@sincelejo_retablo15`.

## 7. Resultado de las pruebas

Ejecutadas por el Agente 3 en un clon limpio del commit `200fc41`:

| Prueba | Resultado |
| --- | --- |
| `npm ci` | Correcto |
| `npm run typecheck` | Correcto |
| `npm test` | 48 de 48 superadas |
| `npm run build` | Correcto (JS de 91,6 kB comprimido) |
| `npm run test:e2e` | 33 superadas, 5 omitidas por diseño, 0 fallidas (Chrome escritorio y Pixel 7) |
| `npm audit` | 0 vulnerabilidades |
| Apertura en Chromium (5173 y 4173, a 1366 y 390 px) | Sin errores de consola ni imágenes rotas |

## 8. Errores encontrados, correcciones y auditoría

En tres rondas aparecieron 1 error crítico, 7 importantes y 18 mejoras. La ronda 3 quedó **APROBADA**.
El detalle está en [AUDITORIA.md](AUDITORIA.md) y en `docs/auditoria/`.

## 9. URLs

- **Repositorio:** https://github.com/mapb2830-collab/sincelejo-retablos (creado y vacío; el código aún **no** se ha subido).
- **Vista previa pública:** https://mapb2830-collab.github.io/sincelejo-retablos/, **no desplegada todavía**.
- **Local:**
  - Desarrollo: http://localhost:5173 (`npm run dev`).
  - Compilación de producción: http://localhost:4173 (`npm run build && npm run preview`).

## 10. Ejecutar localmente

```bash
npm install
npm run dev            # abre http://localhost:5173 en Chrome
npm run test:all       # tipos, unitarias, build y pruebas en navegador
```
La primera vez, antes de las pruebas de navegador, ejecuta `npx playwright install chromium`.

## 11. Publicar (cuando haya acceso)

1. En GitHub, ve a Settings → Pages → Source y elige **GitHub Actions**.
2. Sube el código:
   ```bash
   git remote add origin https://github.com/mapb2830-collab/sincelejo-retablos.git
   git push -u origin main
   ```
3. En Actions, comprueba que el flujo "CI y despliegue en GitHub Pages" termine en verde. Después revisa la URL pública.

Para actualizar la página: edita, ejecuta `npm run test:all`, haz commit y `git push`.

## 12. Continuar con los pagos

Sigue [PAGOS.md](PAGOS.md):
1. Elegir el proveedor y completar su vinculación.
2. Construir el backend (`POST /orders`, `GET /orders/:ref/payment`, webhook firmado).
3. Guardar los secretos solo en el servidor.
4. Configurar `VITE_PAYMENTS_ENABLED` y `VITE_ORDERS_API_URL`.
5. Probar en sandbox los casos aprobado, rechazado, pendiente y duplicado.

## 13. Nuevos productos y precios

Ver [CATALOGO.md](CATALOGO.md):
- Edita `src/catalog/products.ts`.
- Pon las imágenes WebP de 480 y 900 px en `public/images/products/`.
- Actualiza la tabla de precios oficiales en `tests/unit/catalog.test.ts`.
- Para activar una línea de Novedades, muévela de `categories.ts` a `products.ts` con su precio confirmado.
