import type { ProductImage } from '../../domain/product';

const base = import.meta.env.BASE_URL;

/** Imagen responsive (WebP 480/900 px) con carga diferida y etiqueta para imágenes ilustrativas. */
export function Picture({
  image,
  sizes = '(min-width: 1100px) 300px, (min-width: 700px) 45vw, 92vw',
  eager = false,
  className = '',
  showKind = true,
}: {
  image: ProductImage;
  sizes?: string;
  eager?: boolean;
  className?: string;
  showKind?: boolean;
}) {
  const src = `${base}${image.src}`;
  return (
    <figure className={`picture ${className}`}>
      <img
        src={`${src}-900.webp`}
        srcSet={`${src}-480.webp 480w, ${src}-900.webp 900w`}
        sizes={sizes}
        alt={image.alt}
        width={900}
        height={1200}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...(eager ? { fetchPriority: 'high' as const } : {})}
      />
      {showKind && image.kind === 'ilustrativa' && (
        <figcaption className="picture__badge" title="No es una fotografía de un trabajo de Sincelejo Retablos">
          Imagen ilustrativa
        </figcaption>
      )}
    </figure>
  );
}
