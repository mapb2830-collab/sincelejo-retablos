import { useState } from 'react';
import { markSentByCustomer } from '../../application/prepareOrder';
import { services } from '../../application/services';
import { buildOrderMessage, whatsappLink } from '../../adapters/whatsapp/whatsappOrderChannel';
import { upcomingLines } from '../../catalog';
import { business } from '../../config/business';
import { env } from '../../config/env';
import { formatCOP } from '../../domain/money';
import { ORDER_STATUS_LABEL } from '../../domain/order';
import { Icon } from '../components/Icon';
import { PageHeader } from '../components/Layout';
import { OrderSteps } from '../components/OrderSteps';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { href } from '../router/router';

const base = import.meta.env.BASE_URL;

export function TrackingPage() {
  useDocumentTitle('Seguimiento de pedido');
  const [order, setOrder] = useState(() => services.orderHistory.loadLast());
  return (
    <>
      <PageHeader eyebrow="Pedido" title="Seguimiento de tu pedido">
        <p>Así avanza un pedido en {business.name}. Esta página muestra el último pedido que preparaste en este navegador.</p>
      </PageHeader>
      <div className="container narrow">
        {order ? (
          <div className="box" data-testid="tracking-order">
            <p className="eyebrow">Referencia {order.reference}</p>
            <h2 data-testid="tracking-status">
              Estado: {ORDER_STATUS_LABEL[order.status]}
              {order.status === 'enviado-al-negocio' && order.sentDeclaredByCustomer ? ' (según indicaste)' : ''}
            </h2>
            <p className="field__help">
              Preparado el {fmtDate(order.createdAt)}.
              {order.whatsappOpenedAt && <> Abriste WhatsApp con este pedido el {fmtDate(order.whatsappOpenedAt)}.</>} La confirmación del
              pedido, del envío y del pago te llega por WhatsApp; esta página no la recibe automáticamente.
            </p>
            {order.status === 'carrito-preparado' && (
              <div className="alert alert--warn">
                <p>Si ya enviaste el mensaje en WhatsApp, márcalo aquí para recordarlo.</p>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => setOrder(markSentByCustomer(order, services.orderHistory))}>
                  Ya envié el mensaje
                </button>
              </div>
            )}
            <OrderSteps current={order.status} />
            <ul className="mini-lines">
              {order.lines.map((l, i) => (
                <li key={i}>
                  <span>{l.quantity} × {l.name} <small>{l.variant}</small></span>
                  <span>{l.subtotal === null ? 'Por cotizar' : formatCOP(l.subtotal)}</span>
                </li>
              ))}
            </ul>
            <p><strong>Total de productos: {formatCOP(order.productsTotal)}</strong> · Envío pendiente de cotización</p>
            <div className="hero__ctas">
              <a className="btn btn--whatsapp" href={whatsappLink(env.whatsappNumber, buildOrderMessage(order))} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" /> Reenviar por WhatsApp
              </a>
              <a className="btn btn--outline" href={whatsappLink(env.whatsappNumber, `Hola, quiero saber el estado de mi pedido ${order.reference}.`)} target="_blank" rel="noopener noreferrer">
                Preguntar por el estado
              </a>
              <button type="button" className="btn btn--ghost" onClick={() => { services.orderHistory.clear(); setOrder(null); }}>
                Borrar de este navegador
              </button>
            </div>
          </div>
        ) : (
          <div className="box">
            <h2>Aún no has preparado un pedido en este navegador</h2>
            <OrderSteps current="carrito-preparado" />
            <a className="btn btn--primary" href={href.catalogo()}>Ir al catálogo</a>
          </div>
        )}
      </div>
    </>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });
}

export function UpcomingPage() {
  useDocumentTitle('Novedades', 'Próximas líneas de productos personalizados de Sincelejo Retablos.');
  return (
    <>
      <PageHeader eyebrow="Novedades" title="Próximamente en Sincelejo Retablos">
        <p>Líneas que estamos preparando. Todavía no tienen precio ni disponibilidad confirmados.</p>
      </PageHeader>
      <div className="container">
        <ul className="upcoming">
          {upcomingLines.map((u) => (
            <li key={u.id} className="upcoming__item" data-testid="upcoming">
              <span className="pill">Próximamente</span>
              <h2>{u.name}</h2>
              <p>{u.description}</p>
              <p className="upcoming__status">Precio y disponibilidad: pendientes de confirmar.</p>
              <a className="btn btn--outline btn--sm" href={whatsappLink(env.whatsappNumber, `Hola, quiero saber cuándo estará disponible: ${u.name}.`)} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" /> Avísame por WhatsApp
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export function AboutPage() {
  useDocumentTitle('Empresa', `${business.name}: impresión y productos personalizados en ${business.city}, ${business.region}.`);
  return (
    <>
      <PageHeader eyebrow="Empresa" title={`Somos ${business.name}`} />
      <div className="container split split--media about">
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
          <p className="section__lead">
            {business.name} es un negocio de {business.city}, {business.region}, ubicado en el {business.neighborhood}. Hacemos retablos
            personalizados con acabado laminado, forros para celulares, llaveros, fotos polaroid, pendones, tarjetas de presentación, tarjetas
            personalizadas y stickers.
          </p>
          <ul className="checks">
            <li><Icon name="pin" /> {business.neighborhood}, {business.city}, {business.region}, {business.country}.</li>
            <li><Icon name="wallet" /> Formas de pago: transferencia o efectivo.</li>
            <li><Icon name="truck" /> Envío a domicilio: el costo depende del lugar de destino.</li>
            <li><Icon name="whatsapp" /> Pedidos por WhatsApp: {business.phoneDisplay}.</li>
          </ul>
          <a className="btn btn--primary" href={href.catalogo()}>Ver productos <Icon name="arrow" /></a>
        </div>
      </div>
    </>
  );
}

export function ContactPage() {
  useDocumentTitle('Contacto', `Escríbenos por WhatsApp al ${business.phoneDisplay} o en Instagram @${business.instagramHandle}.`);
  return (
    <>
      <PageHeader eyebrow="Contacto" title="Hablemos de tu pedido" />
      <div className="container contact">
        <a className="contact__card contact__card--wa" href={whatsappLink(env.whatsappNumber, 'Hola, Sincelejo Retablos. Quiero información.')} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" size={32} />
          <span><strong>WhatsApp de pedidos</strong>{business.phoneDisplay}</span>
        </a>
        <a className="contact__card contact__card--ig" href={business.instagramUrl} target="_blank" rel="noopener noreferrer">
          <Icon name="instagram" size={32} />
          <span><strong>Instagram</strong>@{business.instagramHandle}</span>
        </a>
        <a className="contact__card" href={`tel:+57${business.phoneLocal}`}>
          <Icon name="phone" size={32} />
          <span><strong>Llamar</strong>{business.phoneDisplay}</span>
        </a>
        <div className="contact__card contact__card--static">
          <Icon name="pin" size={32} />
          <span><strong>Ubicación</strong>{business.neighborhood}, {business.city}, {business.region}</span>
        </div>
      </div>
      <div className="container narrow">
        <p className="note"><Icon name="info" /> Para cualquier consulta sobre tu pedido, escríbenos por WhatsApp.</p>
      </div>
    </>
  );
}

const faqs: { q: string; a: React.ReactNode }[] = [
  { q: '¿Cómo hago un pedido?', a: <>Agrega productos al carrito, completa tus datos en <a href={href.pedido}>Preparar pedido</a> y abre WhatsApp con el resumen. El pedido queda confirmado cuando el negocio te responde.</> },
  { q: '¿Cuáles son las formas de pago?', a: 'Transferencia o efectivo. Los datos para pagar te los da el negocio al confirmar el pedido. Por ahora no hay pagos en línea en la página.' },
  { q: '¿Hacen envíos a domicilio?', a: 'Sí. El costo del envío depende del lugar de destino y se cotiza por WhatsApp; no está incluido en el total del carrito.' },
  { q: '¿Cómo envío la foto o el diseño?', a: 'Al agregar un producto puedes describir tu diseño y elegir una imagen de referencia; en el carrito puedes editar las instrucciones. La imagen se envía directamente en el chat de WhatsApp.' },
  { q: '¿Tienen forros para mi celular?', a: 'Indica la marca y el modelo al agregar el forro. Te confirmamos por WhatsApp si está disponible para tu modelo.' },
  { q: '¿Qué acabado tienen los retablos?', a: 'Se elaboran con acabado laminado, que brinda mayor durabilidad y un excelente realce de colores.' },
  { q: '¿Los pendones traen con qué colgarlos?', a: 'Sí, los pendones incluyen tubos para colgar.' },
  { q: '¿Cuántas tarjetas o stickers trae cada paquete?', a: 'Las tarjetas de presentación se venden por millar (1.000 unidades) y los stickers en paquetes de 100.' },
  { q: '¿Cuánto cuestan las tarjetas personalizadas?', a: 'El catálogo no publica un precio para las tarjetas personalizadas. Pide tu cotización por WhatsApp.' },
  { q: '¿Las fotos de pendones y tarjetas de presentación son trabajos reales?', a: 'Las imágenes marcadas como "Imagen ilustrativa" son referencias de diseño, no fotografías de trabajos entregados.' },
];

export function FaqPage() {
  useDocumentTitle('Preguntas frecuentes');
  return (
    <>
      <PageHeader eyebrow="Ayuda" title="Preguntas frecuentes" />
      <div className="container narrow faq">
        {faqs.map((f) => (
          <details key={f.q} className="faq__item">
            <summary>{f.q}</summary>
            <div className="faq__a">{f.a}</div>
          </details>
        ))}
        <p className="note"><Icon name="whatsapp" /> ¿Otra pregunta? <a href={whatsappLink(env.whatsappNumber)} target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp</a>.</p>
      </div>
    </>
  );
}

export function NotFoundPage() {
  useDocumentTitle('Página no encontrada');
  return (
    <>
      <PageHeader title="No encontramos esta página" />
      <div className="container">
        <div className="empty">
          <p>El enlace puede estar incompleto o la página ya no existe.</p>
          <a className="btn btn--primary" href={href.inicio}>Volver al inicio</a>
        </div>
      </div>
    </>
  );
}
