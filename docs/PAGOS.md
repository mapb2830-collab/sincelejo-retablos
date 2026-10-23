# Pagos en línea · Fase 2 (no implementado)

> **Estado:** preparado, **no terminado**. La página no cobra, no simula pagos y no marca ningún pedido como pagado.
> Hoy los pagos son por transferencia o en efectivo, coordinados por WhatsApp.

## Por qué hace falta un servidor

GitHub Pages solo sirve archivos estáticos. Un pago seguro necesita un servidor que:

1. Guarde las claves privadas de la pasarela (nunca en el navegador ni en GitHub).
2. Calcule el total **desde el catálogo**, no desde lo que envía el navegador.
3. Reciba y verifique los webhooks firmados del proveedor.
4. Registre los pedidos y sus cambios de estado.

Opciones de bajo costo para ese servidor: funciones serverless (Vercel, Netlify, Cloudflare Workers) o un pequeño servicio Node.
La vista pública puede seguir en GitHub Pages.

## Proveedores a evaluar

Wompi (Bancolombia) y Mercado Pago operan en Colombia. **Antes de elegir, verifica en su documentación oficial vigente**
los requisitos de vinculación (persona natural o empresa, RUT, cuenta bancaria), métodos de pago (PSE, tarjetas, Nequi, etc.),
comisiones y tiempos de desembolso. Este documento no fija comisiones porque cambian.

## Lo que ya está preparado en el código

| Pieza | Archivo |
| --- | --- |
| Puerto `PaymentGateway` (`startCheckout`, `getStatus`) | `src/ports/index.ts` |
| Adaptador activo hoy: pagos no disponibles | `src/adapters/payments/unavailablePaymentGateway.ts` |
| Adaptador HTTP hacia **tu backend** (envía solo ids y cantidades) | `src/adapters/payments/httpPaymentGateway.ts` |
| Estados del pago y transiciones válidas | `src/domain/payment.ts` |
| Estados del pedido | `src/domain/order.ts` |
| Activación por configuración | `VITE_PAYMENTS_ENABLED`, `VITE_ORDERS_API_URL` → `src/application/services.ts` |

## Contrato del backend (propuesto)

```
POST /orders
  body: { orderReference, lines: [{ productId, variantId, quantity }] }
  → el servidor busca precios en su copia del catálogo, calcula el total en centavos,
    crea el pedido (estado: carrito-preparado / pago: pendiente) y la transacción con la pasarela.
  ← { orderReference, redirectUrl }   (URL https del checkout del proveedor)

GET /orders/:reference/payment
  ← { status: 'pendiente' | 'aprobado' | 'rechazado' | 'anulado' | 'error' }

POST /webhooks/<proveedor>
  → verifica la firma/checksum del evento con el secreto de eventos,
    consulta la transacción al proveedor por su id, compara monto y referencia,
    aplica la transición con canTransitionPayment() y guarda un registro del evento.
```

## Reglas obligatorias

- El estado **aprobado** solo se acepta tras verificar la firma del webhook **y** consultar la transacción en el servidor.
  La redirección de regreso al sitio no prueba nada por sí sola.
- Idempotencia: el mismo evento puede llegar varias veces; usa el id de la transacción para no duplicar cambios.
- Pagos pendientes (por ejemplo PSE) pueden tardar: muestra "pendiente" hasta recibir el evento final.
- Registra fecha, referencia, id de transacción, estado anterior y nuevo. No registres datos de tarjetas.
- Variables solo del servidor: `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` (o equivalentes de Mercado Pago).
  Configúralas como secretos del proveedor de hosting, nunca en `.env` del frontend.
- Usa primero el entorno de pruebas (sandbox) del proveedor y documenta los resultados antes de activar producción.

## Pasos para activar

1. Elegir proveedor y completar la vinculación comercial.
2. Crear el backend con el contrato anterior y sus pruebas (incluida la verificación de firmas con eventos de prueba).
3. Desplegar el backend con sus secretos.
4. En el frontend: `VITE_PAYMENTS_ENABLED=true` y `VITE_ORDERS_API_URL=https://…`, y añadir el botón "Pagar en línea" en `CheckoutPage`.
5. Probar en sandbox: aprobado, rechazado, pendiente y webhook duplicado.
6. Solo entonces marcar la función como terminada en el README.
