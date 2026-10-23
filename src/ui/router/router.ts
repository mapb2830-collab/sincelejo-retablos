import { useEffect, useState } from 'react';

/**
 * Enrutador por hash (#/ruta). Se eligió para que el sitio funcione en GitHub Pages
 * (hosting estático) sin reglas de reescritura de servidor ni errores 404 al recargar.
 */
export type Route =
  | { name: 'inicio' }
  | { name: 'catalogo'; category?: string }
  | { name: 'carrito' }
  | { name: 'pedido' }
  | { name: 'seguimiento' }
  | { name: 'novedades' }
  | { name: 'empresa' }
  | { name: 'contacto' }
  | { name: 'faq' }
  | { name: 'no-encontrado' };

export function parseHash(hash: string): Route {
  const path = decodeURIComponent(hash.replace(/^#/, '')).replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  const [first, second] = parts;
  if (!first) return { name: 'inicio' };
  switch (first) {
    case 'catalogo':
      return parts.length <= 2 ? { name: 'catalogo', category: second } : { name: 'no-encontrado' };
    case 'carrito':
      return { name: 'carrito' };
    case 'pedido':
      return { name: 'pedido' };
    case 'seguimiento':
      return { name: 'seguimiento' };
    case 'novedades':
      return { name: 'novedades' };
    case 'empresa':
      return { name: 'empresa' };
    case 'contacto':
      return { name: 'contacto' };
    case 'preguntas-frecuentes':
      return { name: 'faq' };
    default:
      return { name: 'no-encontrado' };
  }
}

export const href = {
  inicio: '#/',
  catalogo: (category?: string) => (category ? `#/catalogo/${category}` : '#/catalogo'),
  carrito: '#/carrito',
  pedido: '#/pedido',
  seguimiento: '#/seguimiento',
  novedades: '#/novedades',
  empresa: '#/empresa',
  contacto: '#/contacto',
  faq: '#/preguntas-frecuentes',
};

export function navigate(to: string): void {
  window.location.hash = to.replace(/^#/, '');
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
