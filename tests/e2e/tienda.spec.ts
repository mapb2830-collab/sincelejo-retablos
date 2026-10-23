import { expect, test, type Page } from '@playwright/test';

/** Recoge errores de consola y de página para exigir cero errores. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

const OFFICIAL_PRICES = [
  '$10.000', '$22.000', '$35.000', '$65.000', '$140.000',
  '$5.000', '$7.000', '$18.000', '$30.000', '$45.000', '$55.000', '$70.000', '$85.000', '$160.000',
];

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('la portada carga sin errores, con título, imágenes y enlaces de contacto', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./');
  await expect(page).toHaveTitle(/Sincelejo Retablos/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('retablos');
  const wa = page.locator('a.wa-fab');
  await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/573013804470\?text=/);
  await expect(page.locator('footer a[href="https://www.instagram.com/sincelejo_retablos15/"]')).toBeVisible();
  // Todas las imágenes visibles cargan (naturalWidth > 0)
  await page.evaluate(async () => {
    for (const img of Array.from(document.images)) { img.loading = 'eager'; }
    await Promise.all(Array.from(document.images).map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
  });
  const broken = await page.evaluate(() => Array.from(document.images).filter((i) => i.naturalWidth === 0).map((i) => i.src));
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});

test('el catálogo de retablos muestra las 14 medidas con sus precios oficiales', async ({ page }) => {
  await page.goto('./#/catalogo/retablos');
  const cards = page.getByTestId('product-card');
  await expect(cards).toHaveCount(14);
  const prices = await page.locator('[data-testid="product-card"] .price__amount').allTextContents();
  expect(prices).toEqual(OFFICIAL_PRICES);
});

test('los filtros de categoría y la búsqueda funcionan', async ({ page }) => {
  await page.goto('./#/catalogo');
  await page.locator('.catbar').getByRole('link', { name: 'Pendones' }).click();
  await expect(page).toHaveURL(/#\/catalogo\/pendones$/);
  await expect(page.getByTestId('product-card')).toHaveCount(5);
  await expect(page.locator('.picture__badge').first()).toHaveText('Imagen ilustrativa');
  await page.locator('.catbar').getByRole('link', { name: 'Todos' }).click();
  await page.getByLabel('Buscar productos').fill('30x40');
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await expect(page.getByTestId('product-card')).toContainText('$30.000');
  await page.getByLabel('Buscar productos').fill('pendón 50 x 70');
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await expect(page.getByTestId('product-card')).toContainText('$25.000');
  await page.getByLabel('Buscar productos').fill('zzz');
  await expect(page.getByText(/No encontramos productos/)).toBeVisible();
});

test('todas las rutas del menú cargan su página', async ({ page }) => {
  const routes: [string, RegExp][] = [
    ['#/catalogo/forros', /Forros para celulares/],
    ['#/catalogo/llaveros', /Llaveros/],
    ['#/catalogo/polaroid', /Fotos polaroid/],
    ['#/catalogo/tarjetas-presentacion', /Tarjetas de presentación/],
    ['#/catalogo/stickers', /Stickers/],
    ['#/catalogo/otros', /Otros productos/],
    ['#/carrito', /Carrito/],
    ['#/pedido', /Preparar pedido/],
    ['#/seguimiento', /Seguimiento/],
    ['#/novedades', /Próximamente/],
    ['#/empresa', /Somos Sincelejo Retablos/],
    ['#/contacto', /Hablemos/],
    ['#/preguntas-frecuentes', /Preguntas frecuentes/],
    ['#/no-existe', /No encontramos/],
  ];
  for (const [hash, title] of routes) {
    await page.goto(`./${hash}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  }
});

test('flujo completo: agregar, modificar, eliminar, totales y WhatsApp', async ({ page, context }) => {
  const errors = trackErrors(page);
  await page.goto('./#/catalogo/retablos');
  // Retablo 30x40 x2
  await page.locator('[data-variant="30x40"]').getByRole('button', { name: /Agregar/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Aumentar cantidad' }).click();
  await dialog.getByLabel(/Instrucciones de diseño/).fill('Foto de grado con el nombre Ana & Luis');
  await dialog.getByRole('button', { name: /Agregar al carrito/ }).click();
  await expect(page.getByTestId('cart-count')).toHaveText('2');

  // Forro sin modelo: debe bloquear
  await page.goto('./#/catalogo/forros');
  await page.getByRole('radio', { name: /Laminado brillante/ }).check();
  await page.getByRole('button', { name: /Agregar al carrito/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Agregar al carrito/ }).click();
  await expect(page.getByRole('dialog').getByText('Escribe la marca y el modelo')).toBeVisible();
  await page.getByRole('dialog').getByLabel(/Marca y modelo/).fill('Samsung Galaxy A15');
  await page.getByRole('dialog').getByRole('button', { name: /Agregar al carrito/ }).click();

  // Stickers para luego eliminarlos
  await page.goto('./#/catalogo/stickers');
  await page.getByRole('button', { name: /Agregar al carrito/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Agregar al carrito/ }).click();
  await expect(page.getByTestId('cart-count')).toHaveText('4');

  await page.goto('./#/carrito');
  await expect(page.getByTestId('cart-line')).toHaveCount(3);
  await expect(page.getByTestId('cart-total')).toHaveText('$110.000'); // 60.000 + 25.000 + 25.000
  await page.getByRole('button', { name: /Eliminar Stickers/ }).click();
  await expect(page.getByTestId('cart-line')).toHaveCount(2);
  await page.getByTestId('cart-line').first().getByRole('button', { name: 'Aumentar cantidad' }).click();
  await expect(page.getByTestId('line-subtotal').first()).toHaveText('$90.000');
  await expect(page.getByTestId('cart-total')).toHaveText('$115.000');
  const qty = page.getByTestId('cart-line').first().getByLabel('Cantidad', { exact: true });
  await qty.fill('0');
  await qty.press('Enter');
  await expect(qty).toHaveValue('1');
  await expect(page.getByTestId('cart-total')).toHaveText('$55.000');

  // Persistencia al recargar
  await page.reload();
  await expect(page.getByTestId('cart-total')).toHaveText('$55.000');

  // Pedido
  await page.getByRole('complementary', { name: 'Resumen' }).getByRole('link', { name: /Preparar pedido/ }).click();
  await page.getByRole('button', { name: /Preparar mensaje/ }).click();
  await expect(page.getByText('Escribe tu nombre')).toBeVisible();
  await page.getByLabel(/^Nombre/).fill('María Pérez');
  await page.getByLabel(/Teléfono de contacto/).fill('300 123 4567');
  await page.getByText('Envío a domicilio', { exact: true }).click();
  await page.getByLabel(/Ciudad o municipio/).fill('Sincelejo');
  await page.getByLabel(/Dirección o barrio/).fill('Calle 20 # 10-5');
  await page.getByText('Transferencia', { exact: true }).click();
  await page.getByRole('button', { name: /Preparar mensaje/ }).click();
  const preview = page.getByTestId('whatsapp-preview');
  await expect(preview).toContainText('*Nombre:* María Pérez');
  await expect(preview).toContainText('Retablo rectangular – 30 × 40 cm');
  await expect(preview).toContainText('Cantidad: 1 × $30.000 (por unidad) = $30.000');
  await expect(preview).toContainText('Modelo de celular: Samsung Galaxy A15');
  await expect(preview).toContainText('Personalización: Foto de grado con el nombre Ana & Luis');
  await expect(preview).toContainText('*Total de productos:* $55.000');
  await expect(preview).toContainText('*Envío:* pendiente de cotización');

  const link = page.getByTestId('send-whatsapp');
  const hrefValue = await link.getAttribute('href');
  const url = new URL(hrefValue!);
  expect(`${url.origin}${url.pathname}`).toBe('https://wa.me/573013804470');
  expect(url.searchParams.get('text')).toBe(await preview.textContent());

  // Clic real: abre una pestaña nueva hacia WhatsApp (se bloquea la red externa en la prueba)
  await context.route('https://wa.me/**', (route) => route.fulfill({ status: 200, body: 'ok' }));
  const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
  expect(popup.url()).toContain('wa.me/573013804470');
  await popup.close();

  await page.goto('./#/seguimiento');
  await expect(page.getByTestId('tracking-order')).toContainText('Pedido enviado al negocio');
  await expect(page.getByTestId('tracking-order')).not.toContainText('Estado registrado: Pago confirmado');
  expect(errors).toEqual([]);
});

test('vaciar el carrito muestra el estado vacío', async ({ page }) => {
  await page.goto('./#/catalogo/polaroid');
  await page.getByRole('button', { name: /Agregar al carrito/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Agregar al carrito/ }).click();
  await page.goto('./#/carrito');
  await page.getByRole('button', { name: 'Vaciar carrito' }).click();
  await page.getByRole('button', { name: 'Sí, vaciar' }).click();
  await expect(page.getByTestId('cart-empty')).toBeVisible();
  await expect(page.getByTestId('cart-count')).toHaveText('0');
});

test('la imagen de referencia rechaza formatos no permitidos', async ({ page }) => {
  await page.goto('./#/catalogo/llaveros');
  await page.getByRole('button', { name: /Agregar al carrito/ }).click();
  const input = page.getByRole('dialog').locator('input[type="file"]');
  await input.setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
  await expect(page.getByRole('dialog').getByText('Formato no permitido')).toBeVisible();
  await input.setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from([137, 80, 78, 71]) });
  await expect(page.getByRole('dialog').getByText('foto.png')).toBeVisible();
});

test('no hay desbordamiento horizontal y el menú móvil funciona', async ({ page, isMobile }) => {
  for (const hash of ['', '#/catalogo/retablos', '#/carrito', '#/pedido', '#/contacto']) {
    await page.goto(`./${hash}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, hash).toBeLessThanOrEqual(0);
  }
  if (isMobile) {
    await page.goto('./');
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.locator('#menu-movil').getByRole('link', { name: 'Llaveros' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Llaveros');
  }
});

test('los productos futuros no tienen precio ni botón de compra', async ({ page }) => {
  await page.goto('./#/novedades');
  const items = page.getByTestId('upcoming');
  await expect(items).toHaveCount(6);
  await expect(items.filter({ hasText: '$' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Agregar/ })).toHaveCount(0);
});

test('el teclado permite llegar al contenido y cerrar el diálogo con Escape', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Prueba de teclado solo en escritorio');
  await page.goto('./#/catalogo/llaveros');
  await page.reload(); // carga completa: el foco empieza en el documento
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.getByRole('button', { name: /Agregar al carrito/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
