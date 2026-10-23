import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/ui/App';
import { validateReferenceImage } from '../../src/ui/components/ReferenceImageInput';

// jsdom no implementa <dialog>.showModal
beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute('open'); };
  localStorage.clear();
  window.location.hash = '#/catalogo/llaveros';
});

describe('interfaz', () => {
  it('agrega un llavero con instrucciones y lo muestra en el carrito con el total', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /agregar al carrito/i }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /aumentar cantidad/i }));
    await user.type(within(dialog).getByLabelText(/instrucciones de diseño/i), 'Nombre: Sofía');
    await user.click(within(dialog).getByRole('button', { name: /agregar al carrito/i }));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    window.location.hash = '#/carrito';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(await screen.findByTestId('cart-total')).toHaveTextContent('$24.000');
    expect(screen.getByDisplayValue('Nombre: Sofía')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('sr.cart.v1')!).cart.lines).toHaveLength(1);
  });

  it('valida tipo y tamaño de la imagen de referencia', () => {
    expect(validateReferenceImage({ name: 'a.jpg', type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(validateReferenceImage({ name: 'a.pdf', type: 'application/pdf', size: 1000 })).toMatch(/Formato/);
    expect(validateReferenceImage({ name: 'a.png', type: 'image/png', size: 11 * 1024 * 1024 })).toMatch(/10 MB/);
    expect(validateReferenceImage({ name: 'a.heic', type: '', size: 10 })).toBeNull();
    expect(validateReferenceImage({ name: 'a.svg', type: 'image/svg+xml', size: 10 })).toMatch(/Formato/);
  });
});
