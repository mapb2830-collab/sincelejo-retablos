import { useEffect } from 'react';
import { business } from '../../config/business';

const DEFAULT_DESCRIPTION =
  'Retablos personalizados con acabado laminado, forros para celular, llaveros, fotos polaroid, pendones, tarjetas y stickers en Sincelejo, Sucre. Arma tu pedido y envíalo por WhatsApp.';

export function useDocumentTitle(title: string, description?: string): void {
  useEffect(() => {
    document.title = title ? `${title} | ${business.name}` : `${business.name} | Retablos e impresión personalizada en Sincelejo`;
    // Cada página fija su descripción; las que no tienen una propia vuelven a la general.
    document.querySelector('meta[name="description"]')?.setAttribute('content', description ?? DEFAULT_DESCRIPTION);
  }, [title, description]);
}
