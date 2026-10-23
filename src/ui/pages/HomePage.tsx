import { whatsappLink } from '../../adapters/whatsapp/whatsappOrderChannel';
import { categories, minPrice, products } from '../../catalog';
import { business } from '../../config/business';
import { env } from '../../config/env';
import { formatCOP } from '../../domain/money';
import type { ProductImage } from '../../domain/product';
import { Icon } from '../components/Icon';
import { Picture } from '../components/Picture';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { href } from '../router/router';

const base = import.meta.env.BASE_URL;
const heroFrames: ProductImage[] = [
  { src: 'images/products/retablos/rect-60x80', alt: 'Retablo rectangular de quince años', kind: 'real' },
  { src: 'images/products/retablos/cuadrado-60x60', alt: 'Retablo cuadrado con foto de celebración', kind: 'real' },
  { src: 'images/products/forros/glitter', alt: 'Forros personalizados en glitter', kind: 'real' },
];

const retabloCount = products.filter((p) => p.category === 'retablos').reduce((n, p) => n + p.variants.length, 0);

const retabloSizes = products
  .filter((p) => p.category === 'retablos')
  .flatMap((p) => p.variants.map((v) => ({ group: p.group ?? '', label: v.label, price: v.price })));

export function HomePage() {
  useDocumentTitle('', 'Retablos personalizados, forros, llaveros, fotos polaroid, pendones, tarjetas y stickers en Sincelejo, Sucre. Arma tu pedido y envíalo por WhatsApp.');
  const fromRetablos = minPrice('retablos');
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero__inner">
          <div className="hero__copy">
            <p className="hero__eyebrow">
              <Icon name="pin" size={16} /> {business.neighborhood} · {business.city}, {business.region}
            </p>
            <h1 id="hero-title" className="hero__title" tabIndex={-1} data-autofocus>
              Tus fotos favoritas, <span className="grad">convertidas en retablos</span> para tu pared
            </h1>
            <p className="hero__lead">
              Retablos con acabado laminado, forros, llaveros, fotos polaroid, pendones, tarjetas y stickers personalizados. Elige, arma tu
              pedido y envíalo por WhatsApp.
            </p>
            <div className="hero__ctas">
              <a className="btn btn--primary btn--lg" href={href.catalogo('retablos')}>
                Ver retablos {fromRetablos !== null && <>desde {formatCOP(fromRetablos)}</>}
                <Icon name="arrow" />
              </a>
              <a className="btn btn--whatsapp btn--lg" href={whatsappLink(env.whatsappNumber, 'Hola, Sincelejo Retablos. Quiero hacer un pedido.')} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" /> Pedir por WhatsApp
              </a>
            </div>
            <ul className="hero__facts">
              <li><Icon name="sparkle" size={18} /> {retabloCount} medidas de retablo</li>
              <li><Icon name="wallet" size={18} /> Transferencia o efectivo</li>
              <li><Icon name="truck" size={18} /> Envíos a domicilio</li>
            </ul>
          </div>
          <div className="hero__art" aria-hidden="true">
            {heroFrames.map((img, i) => (
              <div key={img.src} className={`frame frame--${i + 1}`}>
                <Picture image={img} eager={i === 1} sizes="(min-width: 900px) 260px, 40vw" showKind={false} />
              </div>
            ))}
            <span className="hero__spark hero__spark--1" />
            <span className="hero__spark hero__spark--2" />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="cats-title">
        <div className="container">
          <div className="section__head">
            <p className="eyebrow">Catálogo</p>
            <h2 id="cats-title" className="section__title">¿Qué quieres personalizar hoy?</h2>
          </div>
          <ul className="cat-grid">
            {categories.map((c) => {
              const from = minPrice(c.id);
              return (
                <li key={c.id}>
                  <a className="cat-tile" href={href.catalogo(c.id)}>
                    <Picture image={c.cover} sizes="(min-width: 1100px) 280px, (min-width: 700px) 30vw, 46vw" />
                    <span className="cat-tile__body">
                      <span className="cat-tile__name">{c.name}</span>
                      <span className="cat-tile__price">{from !== null ? `Desde ${formatCOP(from)}` : 'Por cotización'}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="sizes-title">
        <div className="container split">
          <div>
            <p className="eyebrow">Retablos personalizados</p>
            <h2 id="sizes-title" className="section__title">Todas las medidas, todos los precios a la vista</h2>
            <p className="section__lead">
              Elaborados con acabado laminado, que brinda mayor durabilidad y un excelente realce de colores. Precios por unidad en pesos colombianos.
            </p>
            <a className="btn btn--primary" href={href.catalogo('retablos')}>
              Elegir mi retablo <Icon name="arrow" />
            </a>
          </div>
          <div className="price-tables">
            {['Medidas cuadradas', 'Medidas rectangulares'].map((g) => (
              <table key={g} className="price-table">
                <caption>{g}</caption>
                <thead>
                  <tr>
                    <th scope="col">Medida</th>
                    <th scope="col">Precio c/u</th>
                  </tr>
                </thead>
                <tbody>
                  {retabloSizes
                    .filter((s) => s.group === g)
                    .map((s) => (
                      <tr key={s.label}>
                        <td>{s.label}</td>
                        <td>{s.price === null ? 'Cotizar' : formatCOP(s.price)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="container">
          <div className="section__head">
            <p className="eyebrow">Cómo pedir</p>
            <h2 id="how-title" className="section__title">Tu pedido en tres pasos</h2>
          </div>
          <ol className="how">
            <li>
              <span className="how__n">1</span>
              <h3>Elige tus productos</h3>
              <p>Escoge la medida o la opción y agrégala al carrito. Los precios están siempre visibles.</p>
            </li>
            <li>
              <span className="how__n">2</span>
              <h3>Cuéntanos tu diseño</h3>
              <p>Escribe nombres, fechas o frases, indica el modelo de tu celular y elige tu foto de referencia.</p>
            </li>
            <li>
              <span className="how__n">3</span>
              <h3>Envíalo por WhatsApp</h3>
              <p>Te armamos el resumen con totales. Lo envías, y el negocio confirma el pedido, el envío y el pago.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section section--dark" aria-labelledby="brand-title">
        <div className="container split split--media">
          <img
            className="brand-poster"
            src={`${base}images/brand/poster-560.webp`}
            srcSet={`${base}images/brand/poster-560.webp 560w, ${base}images/brand/poster-1000.webp 1000w`}
            sizes="(min-width: 900px) 420px, 90vw"
            alt="Ilustración oficial de Sincelejo Retablos con el logo y dos personajes con camisetas de la marca"
            width={560}
            height={700}
            loading="lazy"
          />
          <div>
            <p className="eyebrow eyebrow--light">Hecho en Sincelejo</p>
            <h2 id="brand-title" className="section__title">Personalizamos lo que quieres recordar</h2>
            <p className="section__lead">
              Somos {business.name}, en el {business.neighborhood} de {business.city}, {business.region}. Convertimos tus fotos y diseños en retablos,
              forros, llaveros, polaroids, pendones, tarjetas y stickers.
            </p>
            <ul className="checks">
              <li><Icon name="wallet" /> Pagos por transferencia o en efectivo.</li>
              <li><Icon name="truck" /> Envío a domicilio: el costo depende del lugar de destino.</li>
              <li><Icon name="instagram" /> Mira más trabajos en Instagram.</li>
            </ul>
            <div className="hero__ctas">
              <a className="btn btn--light" href={business.instagramUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="instagram" /> @{business.instagramHandle}
              </a>
              <a className="btn btn--outline-light" href={href.empresa}>
                Conocer la empresa
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="next-title">
        <div className="container cta-band">
          <div>
            <p className="eyebrow">Muy pronto</p>
            <h2 id="next-title" className="section__title">Vasos, mugs, forrado de paredes y más</h2>
            <p className="section__lead">Estamos preparando nuevas líneas. Te contamos cuando estén disponibles.</p>
          </div>
          <a className="btn btn--outline" href={href.novedades}>
            Ver novedades <Icon name="arrow" />
          </a>
        </div>
      </section>
    </>
  );
}
