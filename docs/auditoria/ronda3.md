# Auditoría técnica independiente · Ronda 3

**Proyecto:** `/home/claude/sincelejo-retablos` · **Commit auditado:** `b8951aa` ("Corrige hallazgos de la auditoría (ronda 2)"), comparado con `7120828`
**Fecha:** 2026-10-23 · **Auditor:** Agente 2. Solo lectura: no modifiqué el proyecto (`git status` limpio).

Mis scripts están en `/home/claude/audit/` (`r3-checks.mjs` y los de rondas anteriores, que volví a ejecutar).

---

## 1. Resumen y veredicto

## Veredicto: **APROBADO**

Comprobé con pruebas propias que se corrigieron I7, M7, M16, M17 y M18. Volví a ejecutar las pruebas de regresión de las rondas 1 y 2 y siguen pasando. No hay errores críticos ni importantes abiertos y no encontré regresiones nuevas.

Quedan dos mejoras abiertas que no bloquean la aprobación:
- **M3:** el enlace a `docs/AUDITORIA.md` está roto. Se acordó escribir ese archivo después de este veredicto.
- **M5:** el usuario de Instagram que aparece en los logos depende de que el cliente lo confirme.

| Categoría | Abiertos |
| --- | --- |
| Errores críticos | 0 |
| Errores importantes | 0 |
| Mejoras recomendadas | 2 (M3 y M5, ambas pendientes por acuerdo o por el cliente) |

---

## 2. Pruebas ejecutadas (comando → resultado)

| # | Comando / prueba | Resultado |
| --- | --- | --- |
| 1 | `npm run typecheck` | OK (exit 0) |
| 2 | `npm test` | 6 archivos, **48/48 pruebas superadas** |
| 3 | `npm run build` | OK. JS 303,66 kB (91,56 kB gzip). Regeneró `dist/`, que está en `.gitignore` |
| 4 | `npm run test:e2e` | **33 superadas, 5 omitidas** (omisiones por diseño: escritorio o móvil), 0 fallidas |
| 5 | `npm audit` | `found 0 vulnerabilities` |
| 6 | `r3-checks.mjs`, foco tras cerrar el diálogo | **16/16 casos devuelven el foco al botón que abrió el diálogo**: preview y dev (StrictMode) × tarjeta con selector (llaveros) y tarjeta por medida (retablo 60×60) × cierre con X por teclado, X con ratón, Escape y envío. El diálogo se puede volver a abrir y no hay errores de consola |
| 7 | `r3-checks.mjs`, mensaje de WhatsApp con `*`, `_`, `~` y `` ` `` en nombre, modelo e instrucciones | Los símbolos del cliente salen en ancho completo (＊ ＿ ～ ｀). Las únicas etiquetas en negrita son las del sistema (Referencia, Nombre, Total de productos, Envío, Entrega, Forma de pago) |
| 8 | `r3-checks.mjs`, "Ver seguimiento" justo después de preparar el mensaje (sin abrir WhatsApp) | Muestra "Estado: Carrito preparado" (antes decía "Aún no has preparado un pedido") |
| 9 | Build local y build con `VITE_SITE_URL=https://usuario.github.io/sincelejo-retablos` | JSON-LD válido en ambos. En local no aparecen `url`, `logo`, `image`, `og:url` ni `canonical`. Con la URL, todos son absolutos |
| 10 | `python3 yaml.safe_load` del workflow | `test-build`: `{contents: read, pages: read}`. `deploy`: `{pages: write, id-token: write}`. `cancel-in-progress: false` |
| 11 | Regresión: `browser6.mjs` (tarjetas en 7 anchos), `r2-browser3.mjs` (hash malformado, `localStorage` corrupto, carrito manipulado, flujo, seguimiento, menú móvil, accesibilidad), `r2-browser7.mjs` (cierre del diálogo, cantidad en vivo, botón flotante), `browser1.mjs` (14 rutas × 360/768/1366: desbordamiento y consola) | Todo igual que en la ronda 2: 0 recortes, 0 desbordamientos, 0 errores de consola |

Al terminar detuve por PID los servidores auxiliares (4174 y 5175).

---

## 3. Hallazgos

### 3.1 Errores críticos

Ninguno.

### 3.2 Errores importantes

Ninguno.

### 3.3 Mejoras recomendadas (abiertas)

| ID | Estado | Archivo / ubicación | Descripción y corrección |
| --- | --- | --- | --- |
| M3 | **No corregido (pendiente acordado)** | `README.md:85` | Enlaza `docs/AUDITORIA.md`, que todavía no existe. Escribirlo con el resultado final (rondas 1 a 3). Prueba: el enlace resuelve a un archivo existente. |
| M5 | **No corregido (depende del cliente)** | `public/images/brand/*`, `public/og-image.jpg` | Los logos muestran `@sincelejo_retablo15` y la página enlaza `@sincelejo_retablos15` (PDF y requisito). Pendiente de confirmar con el cliente. |

**Observaciones sin categoría de hallazgo:**
- La neutralización de formato también se aplica al nombre del archivo de referencia (`mi_foto.jpg` → `mi＿foto.jpg` en el mensaje). Es solo estético y no afecta al pedido.
- En Seguimiento, "Ya envié el mensaje" se ofrece aunque el cliente no haya abierto WhatsApp desde la página. Es aceptable: el cliente puede haberlo enviado por su cuenta y el estado se rotula "(según indicaste)".

### 3.4 Estado de todos los IDs

| ID | Estado | Evidencia |
| --- | --- | --- |
| C1 | Corregido (ronda 2) | Volví a comprobarlo: 0 recortes a 360, 700, 768, 900, 1024, 1366 y 1920 px |
| I1 | Corregido (ronda 2) | Volví a comprobarlo: el hash malformado muestra la página 404 y no hay errores |
| I2 | Corregido (ronda 2) | Volví a comprobarlo con 3 pedidos corruptos: Seguimiento funciona |
| I3 | Corregido (ronda 2) | Volví a comprobarlo: abrir WhatsApp mantiene "Carrito preparado"; la declaración del cliente cambia a "(según indicaste)" y se mantiene al recargar |
| I4 | Corregido (ronda 2) | Volví a comprobarlo: el diálogo funciona en dev |
| I5 | Corregido (ronda 2) | Borde de campos 3,88:1 |
| I6 | Corregido (ronda 2) | Volví a comprobarlo: Escape devuelve el foco, la trampa de Tab funciona y el enlace de la página actual cierra el menú |
| **I7** | **Corregido** | 16/16 casos con el foco de vuelta en el botón que abrió el diálogo, en preview y en dev. Hay una e2e nueva |
| M1, M2, M4, M6, M8–M15 | Corregidos (ronda 2) | Las pruebas de regresión siguen en verde |
| M3 | No corregido (pendiente acordado) | — |
| M5 | No corregido (depende del cliente) | — |
| **M7** | **Corregido** | `*`, `_`, `~` y `` ` `` del cliente quedan neutralizados. No hay negritas falsas y los saltos de línea siguen controlados |
| **M16** | **Corregido** | `docs/ARQUITECTURA.md` nombra `markWhatsAppOpened` y `markSentByCustomer` y describe el flujo de estados real, la validación de pedidos guardados y el alcance del `ErrorBoundary` |
| **M17** | **Corregido** | `pages: read` en el job `test-build` (YAML válido). No ejecuté GitHub Actions: no es posible desde este entorno |
| **M18** | **Corregido** | El pedido se guarda como "Carrito preparado" al preparar el mensaje. El JSON-LD local ya no lleva URL relativas. El `ErrorBoundary` sigue limitado a `<main>` y ahora está documentado (riesgo bajo, aceptado) |

---

## 4. Regresiones buscadas y verificado sin hallazgos

- **Restauración del foco:**
  - Usa `setTimeout` e `isConnected`, así que no deja el foco en elementos desmontados.
  - El doble `onClose` en Escape (eventos `cancel` y `close`) es inocuo.
  - Funciona en StrictMode.
- **Guardar al preparar:**
  - No altera el flujo de estados: el aviso "¿Enviaste el mensaje?" solo aparece tras abrir WhatsApp.
  - Al volver a preparar, se sobrescribe el último pedido, como cabe esperar.
- **Sin cambios en el resto:** precios oficiales, cálculo de totales, envío no sumado, codificación del enlace `wa.me`, validaciones, responsive, consola, accesibilidad básica, seguridad (0 vulnerabilidades, sin secretos) y rendimiento (+0,2 kB gzip).
