import { ORDER_FLOW, ORDER_STATUS_LABEL, type OrderStatus } from '../../domain/order';
import { Icon } from './Icon';

const HELP: Record<string, string> = {
  'carrito-preparado': 'Elegiste tus productos y datos en esta página.',
  'enviado-al-negocio': 'Tú envías el mensaje en WhatsApp. Abrir WhatsApp no envía nada por sí solo.',
  'confirmado-por-negocio': 'Sincelejo Retablos te responde para confirmar el pedido y el envío.',
  'pago-confirmado': 'El negocio confirma que recibió tu pago (transferencia o efectivo).',
};

export function OrderSteps({ current }: { current: OrderStatus }) {
  const index = ORDER_FLOW.indexOf(current);
  return (
    <ol className="steps">
      {ORDER_FLOW.map((s, i) => {
        const state = i < index ? 'done' : i === index ? 'current' : 'todo';
        return (
          <li key={s} className={`steps__item is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="steps__dot">{state === 'done' ? <Icon name="check" size={16} /> : i + 1}</span>
            <span>
              <strong>{ORDER_STATUS_LABEL[s]}</strong>
              <small>{HELP[s]}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
