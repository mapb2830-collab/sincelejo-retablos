import { useMemo, useState, type FormEvent } from 'react';
import { markSentByCustomer, markWhatsAppOpened, prepareOrder, type PrepareOrderResult } from '../../application/prepareOrder';
import { services } from '../../application/services';
import { business } from '../../config/business';
import { formatCOP } from '../../domain/money';
import { EMPTY_CUSTOMER, type CustomerDetails, type CustomerErrors, type OrderSnapshot } from '../../domain/order';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/Layout';
import { OrderSteps } from '../components/OrderSteps';
import { useCart } from '../hooks/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { href, navigate } from '../router/router';

type Prepared = Extract<PrepareOrderResult, { ok: true }>;

export function CheckoutPage() {
  useDocumentTitle('Preparar pedido');
  const { summary } = useCart();
  const [customer, setCustomer] = useState<CustomerDetails>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [tracked, setTracked] = useState<OrderSnapshot | null>(null);

  const set = <K extends keyof CustomerDetails>(key: K, value: CustomerDetails[K]) => {
    setCustomer((c) => ({ ...c, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setPrepared(null);
  };

  const cartKey = useMemo(() => JSON.stringify(summary.lines.map((l) => [l.line.id, l.line.quantity, l.line.customization])), [summary]);
  const [preparedFor, setPreparedFor] = useState('');
  const stale = prepared !== null && preparedFor !== cartKey;

  if (summary.lines.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Pedido" title="Preparar pedido" />
        <div className="container">
          <div className="empty">
            <h2>No hay productos en tu carrito</h2>
            <p>Agrega productos para preparar tu pedido.</p>
            <a className="btn btn--primary" href={href.catalogo()}>Ir al catálogo</a>
          </div>
        </div>
      </>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = prepareOrder(summary, customer, services.orderChannel);
    if (!result.ok) {
      setErrors(result.customerErrors);
      setMissing(result.missing.map((m) => m.productName));
      setPrepared(null);
      const firstField = Object.keys(result.customerErrors)[0];
      window.setTimeout(() => document.getElementById(firstField ? `c-${firstField}` : 'faltantes')?.focus(), 0);
      return;
    }
    setMissing([]);
    setPrepared(result);
    // Se guarda ya como "carrito preparado" para que Seguimiento lo muestre aunque aún no se abra WhatsApp.
    services.orderHistory.saveLast(result.order);
    setTracked(result.order);
    setPreparedFor(cartKey);
    window.setTimeout(() => document.getElementById('pedido-listo')?.focus(), 0);
  };

  const onOpenWhatsApp = () => {
    if (prepared) setTracked(markWhatsAppOpened(tracked ?? prepared.order, services.orderHistory));
  };
  const onDeclareSent = () => {
    if (tracked) setTracked(markSentByCustomer(tracked, services.orderHistory));
  };

  return (
    <>
      <PageHeader eyebrow="Pedido" title="Preparar pedido por WhatsApp">
        <p>Completa tus datos. Prepararemos un mensaje con tu pedido para que lo envíes a {business.name}.</p>
      </PageHeader>
      <div className="container checkout">
        <form className="checkout__form" onSubmit={submit} noValidate aria-describedby="privacidad">
          <fieldset className="box">
            <legend>Tus datos</legend>
            <Field id="c-name" label="Nombre" required error={errors.name}>
              <input id="c-name" className="input" autoComplete="name" maxLength={60} value={customer.name} onChange={(e) => set('name', e.target.value)} aria-invalid={errors.name ? true : undefined} aria-describedby="c-name-err" />
            </Field>
            <Field id="c-phone" label="Teléfono de contacto" optional error={errors.phone} help="Si prefieres, te respondemos al mismo WhatsApp desde el que escribes.">
              <input id="c-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="300 123 4567" value={customer.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={errors.phone ? true : undefined} aria-describedby="c-phone-help c-phone-err" />
            </Field>
          </fieldset>

          <fieldset className="box">
            <legend>Entrega</legend>
            <div className="choice-group">
              <label className={`choice ${customer.delivery === 'acordar' ? 'is-active' : ''}`}>
                <input type="radio" name="delivery" checked={customer.delivery === 'acordar'} onChange={() => set('delivery', 'acordar')} />
                <span><strong>Acordar por WhatsApp</strong><small>Definimos la entrega en la conversación.</small></span>
              </label>
              <label className={`choice ${customer.delivery === 'domicilio' ? 'is-active' : ''}`}>
                <input type="radio" name="delivery" checked={customer.delivery === 'domicilio'} onChange={() => set('delivery', 'domicilio')} />
                <span><strong>Envío a domicilio</strong><small>El costo depende del lugar de destino.</small></span>
              </label>
            </div>
            {customer.delivery === 'domicilio' && (
              <div className="row">
                <Field id="c-city" label="Ciudad o municipio" required error={errors.city}>
                  <input id="c-city" className="input" autoComplete="address-level2" maxLength={60} value={customer.city} onChange={(e) => set('city', e.target.value)} aria-invalid={errors.city ? true : undefined} aria-describedby="c-city-err" />
                </Field>
                <Field id="c-address" label="Dirección o barrio" required error={errors.address}>
                  <input id="c-address" className="input" autoComplete="street-address" maxLength={120} value={customer.address} onChange={(e) => set('address', e.target.value)} aria-invalid={errors.address ? true : undefined} aria-describedby="c-address-err" />
                </Field>
              </div>
            )}
          </fieldset>

          <fieldset className="box">
            <legend>Pago</legend>
            <p className="field__help">Pagos por transferencia o en efectivo. Los datos de pago te los da el negocio al confirmar el pedido. Todavía no hay pagos en línea.</p>
            <div className="choice-group choice-group--3">
              {(['transferencia', 'efectivo', 'por-definir'] as const).map((p) => (
                <label key={p} className={`choice ${customer.payment === p ? 'is-active' : ''}`}>
                  <input type="radio" name="payment" checked={customer.payment === p} onChange={() => set('payment', p)} />
                  <span><strong>{p === 'transferencia' ? 'Transferencia' : p === 'efectivo' ? 'Efectivo' : 'Lo decido después'}</strong></span>
                </label>
              ))}
            </div>
            <Field id="c-notes" label="Notas adicionales" optional>
              <textarea id="c-notes" className="input textarea" rows={2} maxLength={400} value={customer.notes} onChange={(e) => set('notes', e.target.value)} />
            </Field>
          </fieldset>

          {missing.length > 0 && (
            <div id="faltantes" className="alert alert--error" role="alert" tabIndex={-1}>
              <p>Falta el modelo de celular en: {missing.join(', ')}.</p>
              <a href={href.carrito}>Completar en el carrito</a>
            </div>
          )}

          <p id="privacidad" className="field__help">
            Tus datos no se guardan en ningún servidor: solo se usan para escribir el mensaje que tú decides enviar por WhatsApp.
          </p>
          <button type="submit" className="btn btn--primary btn--lg btn--block">
            Preparar mensaje del pedido
          </button>
        </form>

        <aside className="summary" aria-labelledby="res-pedido">
          <h2 id="res-pedido" className="summary__title">Tu pedido</h2>
          <ul className="mini-lines">
            {summary.lines.map((l) => (
              <li key={l.line.id}>
                <span>{l.line.quantity} × {l.product.name} <small>{l.variant.label}</small></span>
                <span>{l.subtotal === null ? 'Por cotizar' : formatCOP(l.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="summary__rows">
            <div>
              <dt>Total de productos</dt>
              <dd data-testid="checkout-total">{formatCOP(summary.productsTotal)}</dd>
            </div>
            <div>
              <dt>Envío</dt>
              <dd>Pendiente de cotización</dd>
            </div>
          </dl>
          <a href={href.carrito} className="btn btn--ghost btn--block">Editar carrito</a>
        </aside>

        {prepared && (
          <section id="pedido-listo" className="ready box" tabIndex={-1} aria-labelledby="listo-title" data-testid="order-ready">
            <h2 id="listo-title">Tu mensaje está listo · {prepared.order.reference}</h2>
            {stale ? (
              <p className="alert alert--warn">Cambiaste el carrito. Vuelve a preparar el mensaje para incluir los cambios.</p>
            ) : (
              <>
                <OrderSteps current={tracked?.status ?? 'carrito-preparado'} />
                <pre className="ready__preview" data-testid="whatsapp-preview">{prepared.message}</pre>
                <a
                  className="btn btn--whatsapp btn--lg btn--block"
                  href={prepared.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onOpenWhatsApp}
                  data-testid="send-whatsapp"
                >
                  <Icon name="whatsapp" /> Abrir WhatsApp y enviar pedido
                </a>
                <p className="field__help">
                  Al abrir WhatsApp, revisa el mensaje y pulsa enviar. El pedido queda confirmado solo cuando {business.name} te responda. Si elegiste
                  una imagen de referencia, adjúntala en el chat.
                </p>
                {tracked?.whatsappOpenedAt && tracked.status === 'carrito-preparado' && (
                  <div className="alert alert--warn" data-testid="declare-sent">
                    <p>¿Enviaste el mensaje en WhatsApp? Abrir WhatsApp no lo envía automáticamente.</p>
                    <button type="button" className="btn btn--outline btn--sm" onClick={onDeclareSent}>
                      Sí, ya lo envié
                    </button>
                  </div>
                )}
                {tracked?.status === 'enviado-al-negocio' && (
                  <p className="alert alert--ok" role="status">
                    Anotamos que enviaste el pedido. {business.name} te confirmará por WhatsApp el pedido, el envío y el pago.
                  </p>
                )}
                <button type="button" className="btn btn--ghost" onClick={() => navigate(href.seguimiento)}>
                  Ver seguimiento del pedido
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </>
  );
}

function Field({ id, label, required, optional, error, help, children }: { id: string; label: string; required?: boolean; optional?: boolean; error?: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label} {required && <span className="field__req">(obligatorio)</span>}
        {optional && <span className="field__optional">(opcional)</span>}
      </label>
      {children}
      {help && <p id={`${id}-help`} className="field__help">{help}</p>}
      <p id={`${id}-err`} className="field__error" role={error ? 'alert' : undefined}>{error}</p>
    </div>
  );
}
