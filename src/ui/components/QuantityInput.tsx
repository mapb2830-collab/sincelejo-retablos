import { useEffect, useState } from 'react';
import { MAX_QTY, MIN_QTY, clampQuantity } from '../../domain/cart';
import { Icon } from './Icon';

/** Selector de cantidad: botones +/− y campo numérico validado (1 a 999). */
export function QuantityInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = clampQuantity(draft);
    setDraft(String(n));
    if (n !== value) onChange(n);
  };
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" className="qty__btn" onClick={() => onChange(clampQuantity(value - 1))} disabled={value <= MIN_QTY} aria-label="Disminuir cantidad">
        <Icon name="minus" size={18} />
      </button>
      <input
        className="qty__input"
        type="number"
        inputMode="numeric"
        min={MIN_QTY}
        max={MAX_QTY}
        step={1}
        value={draft}
        aria-label="Cantidad"
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
          setDraft(next);
          // Actualiza totales mientras se escribe si el valor ya es válido; los vacíos o 0 se corrigen al salir.
          const n = Number.parseInt(next, 10);
          if (n >= MIN_QTY && n <= MAX_QTY && n !== value) onChange(n);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
      />
      <button type="button" className="qty__btn" onClick={() => onChange(clampQuantity(value + 1))} disabled={value >= MAX_QTY} aria-label="Aumentar cantidad">
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}
