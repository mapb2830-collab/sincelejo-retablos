import { formatCOP } from '../../domain/money';
import { UNIT_LABEL, type Variant } from '../../domain/product';

export function Price({ variant, size = 'md' }: { variant: Variant; size?: 'md' | 'lg' }) {
  if (variant.price === null) {
    return (
      <p className={`price price--${size} price--quote`}>
        <span className="price__amount">Precio por cotización</span>
      </p>
    );
  }
  return (
    <p className={`price price--${size}`}>
      <span className="price__amount">{formatCOP(variant.price)}</span>
      <span className="price__unit">{UNIT_LABEL[variant.unit]}</span>
    </p>
  );
}
