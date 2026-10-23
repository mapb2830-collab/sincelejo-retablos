import { useState } from 'react';
import { imageFor } from '../../catalog';
import { MAX_INSTRUCTIONS, MAX_PHONE_MODEL, isValidPhoneModel } from '../../domain/cart';
import { formatCOP } from '../../domain/money';
import { UNIT_LABEL } from '../../domain/product';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/Layout';
import { QuantityInput } from '../components/QuantityInput';
import { useCart } from '../hooks/CartContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { href } from '../router/router';

const base = import.meta.env.BASE_URL;

export function CartPage() {
  useDocumentTitle('Carrito de compras');
  const { summary, setQuantity, setCustomization, remove, clear } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  if (summary.lines.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Tu pedido" title="Carrito de compras" />
        <div className="container">
          <div className="empty empty--cart" data-testid="cart-empty">
            <span className="empty__icon"><Icon name="cart" size={40} /></span>
            <h2>Tu carrito está vacío</h2>
            <p>Agrega retablos, forros, llaveros y más. Tu carrito se guarda en este navegador mientras eliges.</p>
            <a className="btn btn--primary" href={href.catalogo()}>
              Explorar el catálogo <Icon name="arrow" />
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Tu pedido" title="Carrito de compras">
        <p>Revisa cantidades y detalles de personalización antes de preparar tu pedido.</p>
      </PageHeader>
      <div className="container cart">
        <ul className="cart__lines" aria-label="Productos en el carrito">
          {summary.lines.map(({ line, product, variant, unitPrice, subtotal }) => {
            const img = imageFor(product, variant);
            const needsModel = product.required?.includes('modeloCelular');
            const modelMissing = Boolean(needsModel) && !isValidPhoneModel(line.customization.phoneModel);
            return (
              <li key={line.id} className="cart-line" data-testid="cart-line">
                {img && <img className="cart-line__img" src={`${base}${img.src}-480.webp`} alt="" width={96} height={128} loading="lazy" />}
                <div className="cart-line__info">
                  <h2 className="cart-line__name">{product.name}</h2>
                  <p className="cart-line__variant">{variant.label}</p>
                  <p className="cart-line__unit">
                    {unitPrice === null ? 'Precio por cotizar' : <>{formatCOP(unitPrice)} <small>{UNIT_LABEL[variant.unit]}</small></>}
                  </p>
                  {product.customization.includes('modeloCelular') && (
                    <label className="field field--inline">
                      <span className="field__label">Modelo de celular{needsModel && <span className="field__req"> *</span>}</span>
                      <input
                        className="input"
                        defaultValue={line.customization.phoneModel}
                        maxLength={MAX_PHONE_MODEL}
                        placeholder="Ej.: iPhone 13"
                        onBlur={(e) => setCustomization(line.id, { phoneModel: e.target.value })}
                        aria-invalid={modelMissing ? true : undefined}
                        aria-describedby={modelMissing ? `${line.id}-model-err` : undefined}
                      />
                      {modelMissing && (
                        <span id={`${line.id}-model-err`} className="field__error">
                          Escribe la marca y el modelo de tu celular.
                        </span>
                      )}
                    </label>
                  )}
                  <details className="cart-line__details" open={Boolean(line.customization.instructions)}>
                    <summary>Instrucciones de personalización</summary>
                    <textarea
                      className="input textarea"
                      rows={2}
                      maxLength={MAX_INSTRUCTIONS}
                      defaultValue={line.customization.instructions}
                      placeholder={product.customizationHint}
                      aria-label={`Instrucciones para ${product.name} ${variant.label}`}
                      onBlur={(e) => setCustomization(line.id, { instructions: e.target.value })}
                    />
                  </details>
                  {line.customization.referenceImageName && (
                    <p className="cart-line__file">
                      <Icon name="image" size={16} /> {line.customization.referenceImageName} <small>(envíala por WhatsApp)</small>
                    </p>
                  )}
                </div>
                <div className="cart-line__side">
                  <QuantityInput value={line.quantity} onChange={(n) => setQuantity(line.id, n)} label={`Cantidad de ${product.name} ${variant.label}`} />
                  <p className="cart-line__subtotal" data-testid="line-subtotal">
                    {subtotal === null ? 'Por cotizar' : formatCOP(subtotal)}
                  </p>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => remove(line.id)} aria-label={`Eliminar ${product.name} ${variant.label}`}>
                    <Icon name="trash" size={18} /> Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="summary" aria-labelledby="resumen">
          <h2 id="resumen" className="summary__title">Resumen</h2>
          <dl className="summary__rows">
            <div>
              <dt>Productos</dt>
              <dd>{summary.itemCount}</dd>
            </div>
            <div>
              <dt>Total de productos</dt>
              <dd data-testid="cart-total">{formatCOP(summary.productsTotal)}</dd>
            </div>
            {summary.hasQuoteItems && (
              <div>
                <dt>Productos por cotizar</dt>
                <dd>Precio pendiente</dd>
              </div>
            )}
            <div>
              <dt>Envío</dt>
              <dd>Pendiente de cotización</dd>
            </div>
          </dl>
          <p className="summary__note">El costo del envío depende del lugar de destino y no está incluido en el total.</p>
          <a className="btn btn--primary btn--block btn--lg" href={href.pedido}>
            Preparar pedido <Icon name="arrow" />
          </a>
          <a className="btn btn--ghost btn--block" href={href.catalogo()}>
            Seguir comprando
          </a>
          {confirmClear ? (
            <div className="confirm" role="group" aria-label="Confirmar vaciar carrito">
              <p>¿Vaciar todo el carrito?</p>
              <button type="button" className="btn btn--danger btn--sm" onClick={() => { clear(); setConfirmClear(false); }}>
                Sí, vaciar
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmClear(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn--link" onClick={() => setConfirmClear(true)}>
              Vaciar carrito
            </button>
          )}
        </aside>
      </div>
    </>
  );
}
