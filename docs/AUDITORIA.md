# Auditoría técnica · Resumen

El Agente 2 (auditor independiente, en solo lectura) revisó el proyecto en tres rondas. El Agente 1 corrigió cada hallazgo
y volvió a entregar el proyecto. Los informes completos, con archivo, línea, reproducción y prueba de cada hallazgo, están en
[`docs/auditoria/`](auditoria/). Las rutas `/home/claude/...` que aparecen en ellos son del entorno donde se ejecutó la auditoría.

| Ronda | Commit | Veredicto | Críticos | Importantes | Mejoras |
| --- | --- | --- | --- | --- | --- |
| [1](auditoria/ronda1.md) | `94fa824` | NO APROBADO | 1 | 6 | 15 |
| [2](auditoria/ronda2.md) | `7120828` | NO APROBADO | 0 | 1 (nuevo) | 3 nuevas + 3 abiertas |
| [3](auditoria/ronda3.md) | `b8951aa` | **APROBADO** | 0 | 0 | 2 abiertas (M3, M5) |

## Errores encontrados y cómo se corrigieron

| ID | Problema | Corrección |
| --- | --- | --- |
| C1 | Tarjetas con selector recortaban títulos y precios ("$25.00") en tableta y escritorio | Una columna para tarjetas anchas; foto al lado solo desde 760 px; prueba e2e de recorte en 5 anchos |
| I1 | Un `#` mal codificado dejaba la tienda en blanco | `try/catch` en el enrutador y `ErrorBoundary` |
| I2 | Un pedido guardado corrupto dejaba Seguimiento en blanco | Validación completa del pedido guardado (`isValidOrderSnapshot`) |
| I3 | Abrir WhatsApp marcaba "Pedido enviado al negocio" | Abrir WhatsApp solo anota la hora; el cliente declara el envío con "Ya envié el mensaje" |
| I4 | En `npm run dev` el diálogo se cerraba solo (StrictMode) | Sin `close()` en la limpieza del efecto; prueba con el servidor de desarrollo |
| I5 | Borde de campos con contraste 1,63:1 | Nuevo color de borde, 3,88:1 |
| I6 | El menú móvil no gestionaba el foco | Escape devuelve el foco, trampa de Tab, los enlaces cierran el menú |
| I7 | Al cerrar el diálogo el foco iba al inicio de la página | El foco vuelve al botón que abrió el diálogo |
| M1–M18 | Ids duplicados, subtotal en vivo, textos no respaldados, precio ajeno en maqueta, formato de WhatsApp, SEO y despliegue, sincronización entre pestañas, etc. | Ver informes; todas corregidas salvo M5 |

## Pendiente

- **M5:** los logos muestran `@sincelejo_retablo15` y la página enlaza `@sincelejo_retablos15` (la del catálogo). Lo debe confirmar el negocio.
- El flujo de GitHub Actions y la publicación en GitHub Pages no se han podido ejecutar todavía (falta acceso de escritura al repositorio).

## Resultado de las pruebas (commit aprobado)

- `npm run typecheck`: sin errores.
- `npm test`: 48/48 pruebas unitarias.
- `npm run build`: correcto (JS 91,6 kB comprimido).
- `npm run test:e2e`: 33 superadas, 5 omitidas por diseño (solo escritorio o solo móvil), 0 fallidas, en Chromium escritorio y móvil (Pixel 7).
- `npm audit`: 0 vulnerabilidades.
