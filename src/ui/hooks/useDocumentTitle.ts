import { useEffect } from 'react';
import { business } from '../../config/business';

export function useDocumentTitle(title: string, description?: string): void {
  useEffect(() => {
    document.title = title ? `${title} | ${business.name}` : `${business.name} | Retablos e impresión personalizada en Sincelejo`;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [title, description]);
}
