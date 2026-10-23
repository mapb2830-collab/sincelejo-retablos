import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createHttpPaymentGateway } from '../../src/adapters/payments/httpPaymentGateway';
import { createLocalOrderHistory, isValidOrderSnapshot } from '../../src/adapters/storage/localOrderHistory';
import { catalog } from '../../src/catalog';
import { restoreCart, updateQuantity } from '../../src/domain/cart';
import { parseHash } from '../../src/ui/router/router';
import { App } from '../../src/ui/App';

const validOrder = {
  reference: 'SR-261023-ABCD',
  createdAt: '2026-10-23T15:00:00.000Z',
  status: 'carrito-preparado',
  customer: { name: 'Ana', phone: '', delivery: 'acordar', city: '', address: '', payment: 'por-definir', notes: '' },
  lines: [{ name: 'Llavero personalizado', variant: 'Llavero', unit: 'por unidad', quantity: 1, unitPrice: 12000, subtotal: 12000, instructions: '', phoneModel: '', referenceImageName: '' }],
  productsTotal: 12000,
  hasQuoteItems: false,
  shipping: 'pendiente-de-cotizacion',
};

describe('enrutador', () => {
  it('no lanza con hashes mal codificados', () => {
    expect(parseHash('#/%')).toEqual({ name: 'no-encontrado' });
    expect(parseHash('#/catalogo/%E0%A4%A')).toEqual({ name: 'no-encontrado' });
    expect(parseHash('#/catalogo/retablos')).toEqual({ name: 'catalogo', category: 'retablos' });
    expect(parseHash('')).toEqual({ name: 'inicio' });
  });
});

describe('historial de pedidos', () => {
  beforeEach(() => localStorage.clear());

  it('acepta un pedido válido', () => {
    expect(isValidOrderSnapshot(validOrder)).toBe(true);
    expect(isValidOrderSnapshot({ ...validOrder, customer: { ...validOrder.customer, delivery: 'recoger' } })).toBe(true);
    expect(isValidOrderSnapshot({ ...validOrder, customer: { ...validOrder.customer, delivery: 'otro' } })).toBe(false);
    localStorage.setItem('sr.lastOrder.v1', JSON.stringify(validOrder));
    expect(createLocalOrderHistory().loadLast()?.reference).toBe('SR-261023-ABCD');
  });

  it.each([
    ['líneas vacías de datos', { reference: 'X', lines: [{}] }],
    ['sin total', { ...validOrder, productsTotal: undefined }],
    ['línea sin precio', { ...validOrder, lines: [{ ...validOrder.lines[0], unitPrice: undefined }] }],
    ['sin cliente', { ...validOrder, customer: undefined }],
    ['estado desconocido', { ...validOrder, status: 'pagado' }],
    ['fecha inválida', { ...validOrder, createdAt: 'ayer' }],
    ['cantidad inválida', { ...validOrder, lines: [{ ...validOrder.lines[0], quantity: -1 }] }],
    ['texto', 'hola'],
  ])('descarta un pedido corrupto: %s', (_name, data) => {
    localStorage.setItem('sr.lastOrder.v1', JSON.stringify(data));
    expect(createLocalOrderHistory().loadLast()).toBeNull();
    expect(localStorage.getItem('sr.lastOrder.v1')).toBeNull();
  });

  it('JSON roto no rompe la lectura', () => {
    localStorage.setItem('sr.lastOrder.v1', '{no es json');
    expect(createLocalOrderHistory().loadLast()).toBeNull();
  });
});

describe('carrito restaurado', () => {
  it('regenera ids repetidos para que cada línea sea independiente', () => {
    const cart = restoreCart(
      { lines: [{ id: 'dup', productId: 'llavero', variantId: 'unidad', quantity: 2 }, { id: 'dup', productId: 'foto-polaroid', variantId: 'unidad', quantity: 1 }] },
      catalog,
    );
    const ids = cart.lines.map((l) => l.id);
    expect(new Set(ids).size).toBe(2);
    const changed = updateQuantity(cart, ids[0]!, 5);
    expect(changed.lines.map((l) => l.quantity)).toEqual([5, 1]);
  });
});

describe('pagos (fase 2)', () => {
  it('getStatus solo acepta estados conocidos', async () => {
    const mk = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;
    expect(await createHttpPaymentGateway('https://api.example', mk({ status: 'hackeado' })).getStatus('SR-1')).toBe('error');
    expect(await createHttpPaymentGateway('https://api.example', mk({ status: 'aprobado' })).getStatus('SR-1')).toBe('aprobado');
  });
});

describe('interfaz en StrictMode', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '#/catalogo/llaveros';
  });

  it('el diálogo sigue abierto y permite agregar (como en npm run dev)', async () => {
    // Simula el comportamiento real: close() dispara el evento "close" de forma asíncrona.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      setTimeout(() => this.dispatchEvent(new Event('close')), 0);
    };
    const user = userEvent.setup();
    render(<StrictMode><App /></StrictMode>);
    await user.click(screen.getByRole('button', { name: /agregar al carrito/i }));
    await new Promise((r) => setTimeout(r, 50));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /agregar al carrito/i }).at(-1)!);
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
  });

  it('un hash mal codificado muestra "No encontramos esta página" en lugar de una pantalla en blanco', () => {
    window.location.hash = '#/catalogo/%E0%A4%A';
    render(<StrictMode><App /></StrictMode>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('No encontramos esta página');
  });
});
