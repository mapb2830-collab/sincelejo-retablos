import { useState } from 'react';
import { whatsappLink } from '../../adapters/whatsapp/whatsappOrderChannel';
import { imageFor } from '../../catalog';
import { env } from '../../config/env';
import { formatCOP } from '../../domain/money';
import type { Product, Variant } from '../../domain/product';
import { AddToCartDialog } from './AddToCartDialog';
import { Icon } from './Icon';
import { Picture } from './Picture';
import { Price } from './Price';

/** Tarjeta de una medida concreta (retablos, pendones): cada medida tiene su foto y su precio. */
export function VariantCard({ product, variant }: { product: Product; variant: Variant }) {
  const [open, setOpen] = useState(false);
  const image = imageFor(product, variant);
  return (
    <article className="card" data-testid="product-card" data-product={product.id} data-variant={variant.id}>
      {image && <Picture image={image} />}
      <div className="card__body">
        <h3 className="card__title">
          {product.name} <span className="card__size">{variant.size ?? variant.label}</span>
        </h3>
        <Price variant={variant} />
        {product.highlights && (
          <ul className="tags">
            {product.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn--primary btn--block" onClick={() => setOpen(true)}>
          <Icon name="cart" /> Agregar<span className="sr-only"> al carrito: {product.name} {variant.label}</span>
        </button>
      </div>
      {open && <AddToCartDialog product={product} variant={variant} onClose={() => setOpen(false)} />}
    </article>
  );
}

/** Tarjeta con selector de variantes (forros, stickers, tarjetas) y galería si hay varias fotos. */
export function SelectorCard({ product }: { product: Product }) {
  const first = product.variants[0];
  const [variantId, setVariantId] = useState(first?.id ?? '');
  const [photo, setPhoto] = useState(0);
  const [open, setOpen] = useState(false);
  const variant = product.variants.find((v) => v.id === variantId) ?? first;
  if (!variant) return null;
  const gallery = product.images.length ? product.images : [];
  const image = variant.image ?? gallery[photo] ?? imageFor(product, variant);
  const quote = variant.price === null;

  return (
    <article className="card card--wide" data-testid="product-card" data-product={product.id}>
      <div className="card__media">
        {image && <Picture image={image} sizes="(min-width: 1100px) 420px, (min-width: 700px) 45vw, 92vw" />}
        {!variant.image && gallery.length > 1 && (
          <div className="thumbs" role="group" aria-label="Más fotos">
            {gallery.map((g, i) => (
              <button
                key={g.src}
                type="button"
                className={`thumbs__btn ${i === photo ? 'is-active' : ''}`}
                aria-label={`Ver foto ${i + 1} de ${gallery.length}`}
                aria-pressed={i === photo}
                onClick={() => setPhoto(i)}
              >
                <img src={`${import.meta.env.BASE_URL}${g.src}-480.webp`} alt="" width={60} height={80} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <p className="card__desc">{product.description}</p>
        {product.variants.length > 1 && (
          <fieldset className="variants">
            <legend className="field__label">Elige una opción</legend>
            {product.variants.map((v) => (
              <label key={v.id} className={`variant ${v.id === variant.id ? 'is-active' : ''}`}>
                <input type="radio" name={`${product.id}-variant`} value={v.id} checked={v.id === variant.id} onChange={() => setVariantId(v.id)} />
                <span className="variant__label">{v.label}</span>
                <span className="variant__price">{v.price === null ? 'Cotizar' : formatCOP(v.price)}</span>
              </label>
            ))}
          </fieldset>
        )}
        <Price variant={variant} size="lg" />
        <div className="card__actions">
          <button type="button" className="btn btn--primary" onClick={() => setOpen(true)}>
            <Icon name="cart" /> {quote ? 'Agregar a la solicitud' : 'Agregar al carrito'}
            <span className="sr-only">: {product.name}</span>
          </button>
          {quote && (
            <a
              className="btn btn--whatsapp"
              href={whatsappLink(env.whatsappNumber, `Hola, Sincelejo Retablos. Quiero cotizar: ${product.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="whatsapp" /> Cotizar por WhatsApp
            </a>
          )}
        </div>
      </div>
      {open && <AddToCartDialog product={product} variant={variant} onClose={() => setOpen(false)} />}
    </article>
  );
}

export function ProductCards({ product }: { product: Product }) {
  if (product.display === 'por-variante') {
    return (
      <>
        {product.variants.map((v) => (
          <VariantCard key={v.id} product={product} variant={v} />
        ))}
      </>
    );
  }
  return <SelectorCard product={product} />;
}
