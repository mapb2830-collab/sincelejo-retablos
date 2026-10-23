import { expect, test } from '@playwright/test';

// El servidor de desarrollo usa React StrictMode (efectos dobles): el diálogo debe seguir funcionando.
test('en `npm run dev` el diálogo permanece abierto y agrega al carrito', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Basta con escritorio');
  await page.goto('http://localhost:5173/#/catalogo/llaveros');
  await page.getByRole('button', { name: /Agregar al carrito/ }).click();
  await page.waitForTimeout(500);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Agregar al carrito/ }).click();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
});
