import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { MAX_INSTRUCTIONS, MAX_PHONE_MODEL, isValidPhoneModel } from '../../domain/cart';
import { formatCOP } from '../../domain/money';
import type { Product, Variant } from '../../domain/product';
import { useCart } from '../hooks/CartContext';
import { useToast } from '../hooks/ToastContext';
import { href } from '../router/router';
import { Icon } from './Icon';
import { Price } from './Price';
import { QuantityInput } from './QuantityInput';
import { ReferenceImageInput } from './ReferenceImageInput';

/** Diálogo modal para personalizar el producto antes de agregarlo al carrito. */
export function AddToCartDialog({ product, variant, onClose: notifyClose }: { product: Product; variant: Variant; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  // Elemento que abrió el diálogo: recibe de nuevo el foco al cerrar (teclado y lectores de pantalla).
  const opener = useRef<HTMLElement | null>(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const onClose = () => {
    notifyClose();
    const target = opener.current;
    window.setTimeout(() => {
      if (target?.isConnected) target.focus();
    }, 0);
  };
  const titleId = useId();
  const { add } = useCart();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [phoneModel, setPhoneModel] = useState('');
  const [imageName, setImageName] = useState('');
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    // Sin limpieza que llame a close(): en StrictMode (desarrollo) el efecto se ejecuta dos veces
    // y el evento "close" asíncrono cerraría el diálogo recién abierto. Al desmontarse, el
    // <dialog> sale del DOM y del top layer por sí solo.
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const wants = (f: Product['customization'][number]) => product.customization.includes(f);
  const modelRequired = product.required?.includes('modeloCelular') ?? false;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (modelRequired && !isValidPhoneModel(phoneModel)) {
      setModelError('Escribe la marca y el modelo de tu celular.');
      return;
    }
    add(product.id, variant.id, quantity, { instructions, phoneModel, referenceImageName: imageName });
    toast({ message: `${product.name} (${variant.label}) agregado al carrito`, action: { label: 'Ver carrito', href: href.carrito } });
    onClose();
  };

  return (
    <dialog ref={ref} className="dialog" aria-labelledby={titleId} onClose={onClose} onCancel={onClose}>
      <form className="dialog__body" onSubmit={submit} noValidate>
        <header className="dialog__header">
          <div>
            <p className="eyebrow">Personaliza tu pedido</p>
            <h2 id={titleId} className="dialog__title">
              {product.name} · {variant.label}
            </h2>
            <Price variant={variant} />
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </header>

        <div className="field">
          <span className="field__label">Cantidad</span>
          <QuantityInput value={quantity} onChange={setQuantity} label="Cantidad a agregar" />
        </div>

        {wants('modeloCelular') && (
          <div className="field">
            <label className="field__label" htmlFor={`${titleId}-model`}>
              Marca y modelo del celular <span className="field__req">(obligatorio)</span>
            </label>
            <input
              id={`${titleId}-model`}
              className="input"
              value={phoneModel}
              maxLength={MAX_PHONE_MODEL}
              placeholder="Ej.: Samsung Galaxy A15"
              onChange={(e) => {
                setPhoneModel(e.target.value);
                setModelError(null);
              }}
              aria-invalid={modelError ? true : undefined}
              aria-describedby={`${titleId}-model-help ${titleId}-model-err`}
            />
            <p id={`${titleId}-model-help`} className="field__help">
              Confirmaremos por WhatsApp la disponibilidad del forro para tu modelo.
            </p>
            <p id={`${titleId}-model-err`} className="field__error" role={modelError ? 'alert' : undefined}>
              {modelError}
            </p>
          </div>
        )}

        {wants('instrucciones') && (
          <div className="field">
            <label className="field__label" htmlFor={`${titleId}-instr`}>
              Instrucciones de diseño <span className="field__optional">(opcional)</span>
            </label>
            <textarea
              id={`${titleId}-instr`}
              className="input textarea"
              rows={3}
              maxLength={MAX_INSTRUCTIONS}
              value={instructions}
              placeholder={product.customizationHint}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <p className="field__help">{instructions.length}/{MAX_INSTRUCTIONS} caracteres</p>
          </div>
        )}

        {wants('imagenReferencia') && <ReferenceImageInput value={imageName} onChange={setImageName} />}

        <footer className="dialog__footer">
          <p className="dialog__subtotal">
            {variant.price === null ? 'Precio por cotizar' : <>Subtotal: <strong>{formatCOP(variant.price * quantity)}</strong></>}
          </p>
          <button type="submit" className="btn btn--primary">
            <Icon name="cart" /> Agregar al carrito
          </button>
        </footer>
      </form>
    </dialog>
  );
}
