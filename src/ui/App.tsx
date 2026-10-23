import { useEffect, useRef } from 'react';
import { Footer, Header, WhatsAppFab } from './components/Layout';
import { CartProvider } from './hooks/CartContext';
import { ToastProvider } from './hooks/ToastContext';
import { CartPage } from './pages/CartPage';
import { CatalogPage } from './pages/CatalogPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { AboutPage, ContactPage, FaqPage, NotFoundPage, TrackingPage, UpcomingPage } from './pages/InfoPages';
import { useRoute, type Route } from './router/router';

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'inicio':
      return <HomePage />;
    case 'catalogo':
      return <CatalogPage key={route.category ?? 'todos'} category={route.category} />;
    case 'carrito':
      return <CartPage />;
    case 'pedido':
      return <CheckoutPage />;
    case 'seguimiento':
      return <TrackingPage />;
    case 'novedades':
      return <UpcomingPage />;
    case 'empresa':
      return <AboutPage />;
    case 'contacto':
      return <ContactPage />;
    case 'faq':
      return <FaqPage />;
    default:
      return <NotFoundPage />;
  }
}

export function App() {
  const route = useRoute();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Al cambiar de página: volver arriba y mover el foco al título (lectores de pantalla).
    window.scrollTo({ top: 0 });
    document.querySelector<HTMLElement>('main [data-autofocus]')?.focus({ preventScroll: true });
  }, [route]);

  return (
    <ToastProvider>
      <CartProvider>
        <a className="skip-link" href="#contenido" onClick={(e) => { e.preventDefault(); document.getElementById('contenido')?.focus(); }}>
          Saltar al contenido
        </a>
        <Header route={route} />
        <main id="contenido" tabIndex={-1}>
          <Page route={route} />
        </main>
        <Footer />
        <WhatsAppFab />
      </CartProvider>
    </ToastProvider>
  );
}
