import { formatCOP } from '../../domain/money';
import type { OrderSnapshot } from '../../domain/order';
import type { OrderChannel } from '../../ports';

const PAYMENT_LABEL = { transferencia: 'Transferencia', efectivo: 'Efectivo' } as const;

/**
 * Neutraliza los símbolos de formato de WhatsApp (*negrita*, _cursiva_, ~tachado~, `mono`) en textos
 * escritos por el cliente, sustituyéndolos por variantes de ancho completo que se ven igual pero no dan formato.
 */
export function neutralizeFormatting(text: string): string {
  return text.replace(/[*_~`]/g, (ch) => ({ '*': '＊', _: '＿', '~': '～', '`': '｀' })[ch] ?? ch);
}

/**
 * Construye el texto del pedido, corto y con lo puntual: productos, personalización, pago, entrega y nombre.
 * Los campos vacíos no se incluyen. Solo texto plano: WhatsApp no interpreta HTML.
 */
export function buildOrderMessage(snapshot: OrderSnapshot): string {
  const n = neutralizeFormatting;
  const oneLine = (text: string) => n(text).replace(/\s*\n\s*/g, ' / ');
  const c = snapshot.customer;
  const out: string[] = [];
  out.push('Hola, quiero hacer este pedido:');
  out.push('');
  snapshot.lines.forEach((l, i) => {
    const price = l.subtotal === null ? 'por cotizar' : formatCOP(l.subtotal);
    // Productos de una sola variante ("Llavero", "Foto polaroid") no repiten el nombre.
    const firstWord = l.variant.toLowerCase().split(' ')[0] ?? '';
    const variant = l.name.toLowerCase().startsWith(firstWord) ? '' : ` – ${l.variant}`;
    out.push(`${i + 1}. ${l.name}${variant} x${l.quantity} = ${price}`);
    if (l.phoneModel) out.push(`   Modelo de celular: ${n(l.phoneModel)}`);
    if (l.instructions) out.push(`   Personalización: ${oneLine(l.instructions)}`);
    if (l.referenceImageName) out.push('   Foto de referencia: te la envío por aquí');
  });
  out.push('');
  const extras = [snapshot.hasQuoteItems ? 'productos por cotizar' : '', c.delivery === 'domicilio' ? 'envío' : ''].filter(Boolean);
  out.push(`*Total:* ${formatCOP(snapshot.productsTotal)}${extras.length ? ` + ${extras.join(' + ')}` : ''}`);
  if (c.payment !== 'por-definir') out.push(`*Pago:* ${PAYMENT_LABEL[c.payment]}`);
  if (c.delivery === 'domicilio') out.push(`*Entrega:* envío a domicilio, ${n(c.address)}, ${n(c.city)}`);
  else if (c.delivery === 'recoger') out.push('*Entrega:* paso a recogerlo');
  else out.push('*Entrega:* la acordamos por aquí');
  out.push(`*Nombre:* ${n(c.name)}`);
  if (c.phone) out.push(`*Teléfono:* ${n(c.phone)}`);
  if (c.notes) out.push(`*Nota:* ${oneLine(c.notes)}`);
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
