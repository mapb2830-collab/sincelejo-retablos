import { formatCOP } from '../../domain/money';
import type { OrderSnapshot } from '../../domain/order';
import type { OrderChannel } from '../../ports';

const PAYMENT_LABEL = { transferencia: 'Transferencia', efectivo: 'Efectivo', 'por-definir': 'Por definir' } as const;

/**
 * Neutraliza los símbolos de formato de WhatsApp (*negrita*, _cursiva_, ~tachado~, `mono`) en textos
 * escritos por el cliente, sustituyéndolos por variantes de ancho completo que se ven igual pero no dan formato.
 */
export function neutralizeFormatting(text: string): string {
  return text.replace(/[*_~`]/g, (ch) => ({ '*': '＊', _: '＿', '~': '～', '`': '｀' })[ch] ?? ch);
}

/** Construye el texto del pedido. Solo texto plano: WhatsApp no interpreta HTML. */
export function buildOrderMessage(snapshot: OrderSnapshot): string {
  const n = neutralizeFormatting;
  const order: OrderSnapshot = {
    ...snapshot,
    customer: { ...snapshot.customer, name: n(snapshot.customer.name), phone: n(snapshot.customer.phone), city: n(snapshot.customer.city), address: n(snapshot.customer.address), notes: n(snapshot.customer.notes) },
    lines: snapshot.lines.map((l) => ({ ...l, instructions: n(l.instructions), phoneModel: n(l.phoneModel), referenceImageName: n(l.referenceImageName) })),
  };
  const c = order.customer;
  const out: string[] = [];
  out.push('Hola, Sincelejo Retablos. Quiero hacer este pedido:');
  out.push('');
  out.push(`*Referencia:* ${order.reference}`);
  out.push(`*Nombre:* ${c.name}`);
  if (c.phone) out.push(`*Teléfono:* ${c.phone}`);
  out.push('');
  out.push('*Productos*');
  order.lines.forEach((l, i) => {
    out.push(`${i + 1}. ${l.name} – ${l.variant}`);
    if (l.unitPrice === null) {
      out.push(`   Cantidad: ${l.quantity} · Precio: por cotizar`);
    } else {
      out.push(`   Cantidad: ${l.quantity} × ${formatCOP(l.unitPrice)} (${l.unit}) = ${formatCOP(l.subtotal ?? 0)}`);
    }
    if (l.phoneModel) out.push(`   Modelo de celular: ${l.phoneModel}`);
    if (l.instructions) out.push(`   Personalización: ${l.instructions.replace(/\s*\n\s*/g, ' / ')}`);
    if (l.referenceImageName) out.push(`   Imagen de referencia: ${l.referenceImageName} (la envío por este chat)`);
  });
  out.push('');
  out.push(`*Total de productos:* ${formatCOP(order.productsTotal)}${order.hasQuoteItems ? ' + productos por cotizar' : ''}`);
  out.push('*Envío:* pendiente de cotización');
  out.push('');
  if (c.delivery === 'domicilio') {
    out.push(`*Entrega a domicilio:* ${c.address}, ${c.city}`);
  } else {
    out.push('*Entrega:* acordar por este chat');
  }
  out.push(`*Forma de pago preferida:* ${PAYMENT_LABEL[c.payment]}`);
  if (c.notes) out.push(`*Notas:* ${c.notes.replace(/\s*\n\s*/g, ' / ')}`);
  out.push('');
  out.push('Quedo atento(a) a la confirmación del pedido, el costo del envío y los datos de pago.');
  return out.join('\n');
}

export function createWhatsAppOrderChannel(phoneNumber: string): OrderChannel {
  return {
    buildMessage: buildOrderMessage,
    buildLink(order) {
      return whatsappLink(phoneNumber, buildOrderMessage(order));
    },
  };
}

export function whatsappLink(phoneNumber: string, text?: string): string {
  const base = `https://wa.me/${phoneNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
