# Arquitectura

## Stack y por qué

| Elección | Motivo |
| --- | --- |
| **Vite + React 19 + TypeScript** | Componentes reutilizables, tipado estricto, compilación rápida, mucha documentación en español y fácil de aprender. |
| **Sitio estático** | Se publica gratis en GitHub Pages; costo de mantenimiento cero en la fase 1. |
| **Sin librerías de UI ni de estado** | Menos dependencias que actualizar; el carrito es lógica pura (`src/domain/cart.ts`). |
| **Enrutado por `#`** | Funciona en GitHub Pages sin reglas de servidor (recargar no da 404). |
| **Vitest + Playwright** | Pruebas de reglas de negocio y pruebas reales en Chrome (escritorio y móvil). |
| **Fuentes autoalojadas (Fontsource)** | Sin llamadas a terceros; Fredoka recuerda la tipografía redondeada del logo. |
| **Imágenes WebP en 480 y 900 px** | Pesan poco en datos móviles; `srcset` elige el tamaño según la pantalla. |

## MVC o hexagonal

**Se eligió una arquitectura hexagonal ligera (puertos y adaptadores).**

- MVC encaja en aplicaciones de servidor que renderizan vistas; en una SPA de React el "controlador" se mezcla con los componentes y la lógica de negocio termina dentro de la interfaz.
- La tienda tiene integraciones que **van a cambiar** (WhatsApp hoy; backend de pedidos y pasarela de pagos mañana). Con puertos y adaptadores, esos cambios no tocan el dominio ni la interfaz.
- Se mantuvo *ligera*: no hay inyección de dependencias, repositorios genéricos ni capas vacías. Solo las separaciones que hoy tienen un uso real.

```
src/
├── config/        business.ts (datos oficiales) · env.ts (variables VITE_ públicas)
├── catalog/       products.ts (ÚNICA fuente de precios) · categories.ts · index.ts (consultas)
├── domain/        Reglas de negocio puras, sin React:
│                  cart.ts (carrito, cantidades, totales, restauración segura)
│                  order.ts (datos del cliente, validación, estados del pedido)
│                  payment.ts (estados del pago para la fase 2) · money.ts (formato COP)
├── ports/         Contratos: CartRepository, OrderHistory, OrderChannel, PaymentGateway
├── adapters/      Implementaciones: whatsapp/ · storage/ (localStorage) · payments/
├── application/   Casos de uso (prepareOrder, markWhatsAppOpened, markSentByCustomer) y composición (services.ts)
├── ui/            React: router/, hooks/ (contexto del carrito, avisos), components/, pages/
└── styles/        global.css (sistema visual)
```

**Regla de dependencias:** `ui → application → domain`, y `adapters → ports/domain`. El dominio no importa nada de React ni del navegador.

## Seguridad en el navegador

- El carrito guarda **identificadores y cantidades, nunca precios**: el precio siempre se lee del catálogo. Un precio manipulado en `localStorage` se ignora (`restoreCart`).
- Textos de clientes: se recortan, se eliminan caracteres de control y React escapa todo al pintar (no se usa `dangerouslySetInnerHTML`).
- Las imágenes de referencia no se suben: se validan (tipo y 10 MB) y solo se guarda el nombre del archivo.
- Los datos del cliente no salen del navegador salvo en el mensaje que el propio cliente envía por WhatsApp.
- Enlaces externos con `rel="noopener noreferrer"`.

## Estados del pedido

`carrito-preparado → enviado-al-negocio → confirmado-por-negocio → pago-confirmado` (o `cancelado`).
En la fase 1 la página solo registra los dos primeros, en el navegador del cliente:

1. Al preparar el mensaje, el pedido se guarda como **carrito preparado**.
2. Abrir WhatsApp **no** cambia el estado (no hay forma de saber si el cliente pulsó "Enviar"); solo se anota la hora en `whatsappOpenedAt`.
3. Si el cliente pulsa **"Ya envié el mensaje"**, pasa a **enviado al negocio** con `sentDeclaredByCustomer: true` y se muestra "(según indicaste)".

"Confirmado por el negocio" y "pago confirmado" solo podrá marcarlos el backend de la fase 2. Los pedidos guardados se validan al leerlos (`isValidOrderSnapshot`); si están dañados se descartan.

La interfaz tiene un `ErrorBoundary` alrededor del contenido de cada página: si una página falla, se muestra un mensaje con enlace a WhatsApp y el encabezado y el pie siguen funcionando.
