import { useMemo, useState } from 'react';
import { categories, getCategory, products, searchProducts } from '../../catalog';
import type { Product } from '../../domain/product';
import { Icon } from '../components/Icon';
import { CategoryBar, PageHeader } from '../components/Layout';
import { ProductCards } from '../components/ProductCard';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { href } from '../router/router';
import { NotFoundPage } from './InfoPages';

export function CatalogPage({ category }: { category?: string }) {
  const cat = category ? getCategory(category) : undefined;
  const [query, setQuery] = useState('');
  useDocumentTitle(cat ? cat.name : 'Catálogo', cat ? `${cat.name}: ${cat.tagline}. Precios en COP.` : undefined);

  const list = useMemo(() => {
    const base = query ? searchProducts(query) : products;
    return cat ? base.filter((p) => p.category === cat.id) : base;
  }, [cat, query]);

  if (category && !cat) return <NotFoundPage />;

  // Agrupa por categoría y subgrupo (p. ej. "Medidas cuadradas").
  const groups = (cat ? [cat] : categories)
    .map((c) => ({ category: c, items: list.filter((p) => p.category === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader eyebrow="Catálogo" title={cat ? cat.name : 'Todos los productos'}>
        <p>{cat ? cat.tagline : 'Precios oficiales en pesos colombianos (COP). Filtra por categoría o busca por nombre o medida.'}</p>
      </PageHeader>
      <CategoryBar active={cat?.id ?? 'todos'} />
      <div className="container catalog">
        <div className="search">
          <Icon name="search" />
          <label htmlFor="buscar" className="sr-only">
            Buscar productos
          </label>
          <input id="buscar" type="search" className="input search__input" placeholder="Buscar: retablo, 30x40, stickers…" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={60} />
        </div>
        {groups.length === 0 && (
          <div className="empty">
            <p>No encontramos productos para “{query}”.</p>
            <button type="button" className="btn btn--outline" onClick={() => setQuery('')}>
              Limpiar búsqueda
            </button>
          </div>
        )}
        {groups.map(({ category: c, items }) => (
          <section key={c.id} className="catalog__group" aria-labelledby={`g-${c.id}`}>
            {!cat && (
              <h2 id={`g-${c.id}`} className="catalog__title">
                <a href={href.catalogo(c.id)}>{c.name}</a>
              </h2>
            )}
            {cat && <h2 id={`g-${c.id}`} className="sr-only">{c.name}</h2>}
            {subgroups(items).map(([group, ps]) => (
              <div key={group || 'all'}>
                {group && <h3 className="catalog__subtitle">{group}</h3>}
                {ps[0]?.display === 'por-variante' && <p className="catalog__desc">{ps[0].description}</p>}
                <div className={`grid ${ps.every((p) => p.display === 'selector') ? 'grid--wide' : ''}`}>
                  {ps.map((p) => (
                    <ProductCards key={p.id} product={p} />
                  ))}
                </div>
              </div>
            ))}
            {c.id === 'otros' && (
              <p className="note">
                <Icon name="info" /> ¿Buscas vasos, mugs o forrado de paredes? Mira las <a href={href.novedades}>novedades</a>.
              </p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

function subgroups(items: Product[]): [string, Product[]][] {
  const map = new Map<string, Product[]>();
  for (const p of items) map.set(p.group ?? '', [...(map.get(p.group ?? '') ?? []), p]);
  return [...map.entries()];
}
