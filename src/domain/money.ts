/** Formatea enteros COP como "$10.000" (separador de miles con punto, sin decimales). */
export function formatCOP(amount: number): string {
  if (!Number.isFinite(amount)) throw new RangeError('Monto inválido');
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$${digits}`;
}
