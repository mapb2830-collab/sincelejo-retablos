import { useEffect, useRef, useState, type ReactNode } from 'react';
import { whatsappLink } from '../../adapters/whatsapp/whatsappOrderChannel';
import { categories } from '../../catalog';
import { business } from '../../config/business';
import { env } from '../../config/env';
import { useCart } from '../hooks/CartContext';
import { href, type Route } from '../router/router';
import { Icon } from './Icon';

const logo = `${import.meta.env.BASE_URL}images/brand/logo`;

const mainNav = [
  { label: 'Catálogo', to: href.catalogo(), match: 'catalogo' },
  { label: 'Novedades', to: href.novedades, match: 'novedades' },
  { label: 'Empresa', to: href.empresa, match: 'empresa' },
  { label: 'Preguntas', to: href.faq, match: 'faq' },
  { label: 'Contacto', to: href.contacto, match: 'contacto' },
];

export function Header({ route }: { route: Route }) {
  const { summary } = useCart();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    if (!open) return;
    const close = (restoreFocus: boolean) => {
      setOpen(false);
      if (restoreFocus) buttonRef.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key !== 'Tab') return;
      // Trampa de foco: el foco circula entre el botón del menú y los enlaces del menú.
      const items = [buttonRef.current, ...Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a') ?? [])].filter(
        (x): x is HTMLElement => Boolean(x),
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!items.includes(document.activeElement as HTMLElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    // Cualquier clic en un enlace del menú lo cierra (también el de la página actual, que no cambia la ruta).
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a')) setOpen(false);
    };
    const menu = menuRef.current;
    document.addEventListener('keydown', onKey);
    menu?.addEventListener('click', onClick);
    document.body.classList.add('no-scroll');
    menu?.querySelector<HTMLAnchorElement>('a')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      menu?.removeEventListener('click', onClick);
      document.body.classList.remove('no-scroll');
    };
  }, [open]);

  return (
    <header className="header">
      <div className="container header__inner">
        <a href={href.inicio} className="brand" aria-label={`${business.name}, ir al inicio`}>
          <img src={`${logo}-128.webp`} srcSet={`${logo}-128.webp 1x, ${logo}-256.webp 2x`} alt="" width={48} height={48} />
          <span className="brand__text">
            Sincelejo <span>Retablos</span>
          </span>
        </a>
        <nav className="nav" aria-label="Principal">
          <ul>
            {mainNav.map((n) => (
              <li key={n.to}>
                <a href={n.to} aria-current={route.name === n.match ? 'page' : undefined}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header__actions">
          <a href={href.carrito} className="cart-btn" aria-label={`Carrito, ${summary.itemCount} ${summary.itemCount === 1 ? 'producto' : 'productos'}`}>
            <Icon name="cart" size={22} />
            <span className={`cart-btn__count ${summary.itemCount === 0 ? 'is-empty' : ''}`} data-testid="cart-count" aria-hidden="true">
              {summary.itemCount}
            </span>
          </a>
          <button ref={buttonRef} type="button" className="icon-btn menu-btn" aria-expanded={open} aria-controls="menu-movil" onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'close' : 'menu'} size={24} />
            <span className="sr-only">{open ? 'Cerrar menú' : 'Abrir menú'}</span>
          </button>
        </div>
      </div>
      <div id="menu-movil" ref={menuRef} className={`drawer ${open ? 'is-open' : ''}`} hidden={!open}>
        <nav aria-label="Menú móvil">
          <p className="drawer__title">Productos</p>
          <ul className="drawer__grid">
            {categories.map((c) => (
              <li key={c.id}>
                <a href={href.catalogo(c.id)}>{c.shortName}</a>
              </li>
            ))}
          </ul>
          <ul className="drawer__list">
            <li><a href={href.inicio}>Inicio</a></li>
            <li><a href={href.catalogo()}>Todo el catálogo</a></li>
            <li><a href={href.novedades}>Novedades</a></li>
            <li><a href={href.seguimiento}>Seguimiento de pedido</a></li>
            <li><a href={href.empresa}>Empresa</a></li>
            <li><a href={href.faq}>Preguntas frecuentes</a></li>
            <li><a href={href.contacto}>Contacto</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function CategoryBar({ active }: { active?: string }) {
  return (
    <nav className="catbar" aria-label="Categorías de productos">
      <ul className="container catbar__list">
        <li>
          <a href={href.catalogo()} aria-current={active === 'todos' ? 'page' : undefined}>
            Todos
          </a>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <a href={href.catalogo(c.id)} aria-current={active === c.id ? 'page' : undefined}>
              {c.shortName}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <img src={`${logo}-256.webp`} alt={`Logo de ${business.name}`} width={96} height={96} loading="lazy" />
          <p>Retablos, forros, llaveros, fotos polaroid, pendones, tarjetas y stickers personalizados en Sincelejo, Sucre.</p>
        </div>
        <div>
          <h2 className="footer__title">Productos</h2>
          <ul className="footer__links">
            {categories.map((c) => (
              <li key={c.id}>
                <a href={href.catalogo(c.id)}>{c.name}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="footer__title">Tu pedido</h2>
          <ul className="footer__links">
            <li><a href={href.carrito}>Carrito de compras</a></li>
            <li><a href={href.pedido}>Preparar pedido</a></li>
            <li><a href={href.seguimiento}>Seguimiento</a></li>
            <li><a href={href.faq}>Preguntas frecuentes</a></li>
            <li><a href={href.novedades}>Novedades</a></li>
            <li><a href={href.empresa}>Sobre la empresa</a></li>
          </ul>
        </div>
        <div>
          <h2 className="footer__title">Contacto</h2>
          <ul className="footer__contact">
            <li>
              <Icon name="pin" />
              <span>{business.neighborhood}, {business.city}, {business.region}, {business.country}</span>
            </li>
            <li>
              <Icon name="whatsapp" />
              <a href={whatsappLink(env.whatsappNumber)} target="_blank" rel="noopener noreferrer">
                {business.phoneDisplay} (WhatsApp)
              </a>
            </li>
            <li>
              <Icon name="instagram" />
              <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer">
                @{business.instagramHandle}
              </a>
            </li>
            <li>
              <Icon name="wallet" />
              <span>Pagos por {business.paymentMethods.join(' o ').toLowerCase()}</span>
            </li>
            <li>
              <Icon name="truck" />
              <span>{business.shippingNote}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="container footer__bottom">
        <p>© {new Date().getFullYear()} {business.name}. Precios en pesos colombianos (COP).</p>
      </div>
    </footer>
  );
}

export function WhatsAppFab() {
  return (
    <a
      className="wa-fab"
      href={whatsappLink(env.whatsappNumber, 'Hola, Sincelejo Retablos. Quiero información sobre sus productos.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp a Sincelejo Retablos"
    >
      <Icon name="whatsapp" size={30} />
    </a>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="container">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-header__title" tabIndex={-1} data-autofocus>
          {title}
        </h1>
        {children && <div className="page-header__lead">{children}</div>}
      </div>
    </div>
  );
}
