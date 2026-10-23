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
  await expect(preview).toContainText('1. Retablo rectangular – 30 × 40 cm x1 = $30.000');
  await expect(preview).toContainText('Forro personalizado para celular – Laminado brillante x1 = $25.000');
  await expect(preview).toContainText('Modelo de celular: Samsung Galaxy A15');
  await expect(preview).toContainText('Personalización: Foto de grado con el nombre Ana & Luis');
  await expect(preview).toContainText('*Total:* $55.000 + envío');
  await expect(preview).toContainText('*Pago:* Transferencia');
  await expect(preview).toContainText('*Entrega:* envío a domicilio, Calle 20 # 10-5, Sincelejo');

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

  // Abrir WhatsApp NO equivale a enviar el pedido.
  await expect(page.getByTestId('declare-sent')).toBeVisible();
  await page.goto('./#/seguimiento');
  await expect(page.getByTestId('tracking-status')).toHaveText('Estado: Carrito preparado');
  await expect(page.getByTestId('tracking-order')).toContainText('Abriste WhatsApp con este pedido');
  await page.getByRole('button', { name: 'Ya envié el mensaje' }).click();
  await expect(page.getByTestId('tracking-status')).toHaveText('Estado: Pedido enviado al negocio (según indicaste)');
  await expect(page.getByTestId('tracking-order')).not.toContainText('Estado: Pago confirmado');
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

for (const shareSupported of [true, false]) {
  test(`la foto de referencia ${shareSupported ? 'se comparte directo a WhatsApp' : 'se adjunta a mano si no se puede compartir'}`, async ({ page }) => {
    await page.addInitScript((supported) => {
      const w = window as unknown as { __shared: { files: string[]; text: string }[] };
      w.__shared = [];
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: supported ? (d: { files?: File[] }) => Boolean(d.files?.length) : undefined });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (d: { files?: File[]; text?: string }) => { w.__shared.push({ files: (d.files ?? []).map((f) => f.name), text: d.text ?? '' }); },
      });
    }, shareSupported);
    await page.reload(); // la página ya se abrió en beforeEach: recargar aplica el script de arriba
    await page.goto('./#/catalogo/llaveros');
    await page.getByRole('button', { name: /Agregar al carrito/ }).click();
    await page.getByRole('dialog').locator('input[type="file"]').setInputFiles({ name: 'mi foto.png', mimeType: 'image/png', buffer: Buffer.from([137, 80, 78, 71]) });
    await page.getByRole('dialog').getByRole('button', { name: /Agregar al carrito/ }).click();
    await page.evaluate(() => { location.hash = '#/pedido'; }); // sin recargar: la foto vive en memoria
    await page.getByLabel(/^Nombre/).fill('Ana');
    await page.getByText('Paso a recogerlo', { exact: true }).click();
    await page.getByText('Efectivo', { exact: true }).click();
    await page.getByRole('button', { name: /Preparar mensaje/ }).click();
    const preview = page.getByTestId('whatsapp-preview');
    await expect(preview).toContainText('Foto de referencia: te la envío por aquí');
    await expect(preview).toContainText('*Entrega:* paso a recogerlo');
    await expect(preview).toContainText('*Pago:* Efectivo');
    const box = page.getByTestId('reference-photo');
    if (shareSupported) {
      await box.getByTestId('share-photo').click();
      await expect(box.getByRole('status')).toBeVisible();
      const shared = await page.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared);
      expect(shared).toEqual([{ files: ['mi foto.png'], text: expect.stringMatching(/^Foto de referencia del pedido SR-/) }]);
    } else {
      await expect(box.getByTestId('share-photo')).toHaveCount(0);
      await expect(box).toContainText('Adjúntala en el chat de WhatsApp');
    }
  });
}

test('dos fotos con el mismo nombre se comparten las dos', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: number[][] };
    w.__shared = [];
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: (d: { files?: File[] }) => Boolean(d.files?.length) });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (d: { files?: File[] }) => { w.__shared.push((d.files ?? []).map((f) => f.size)); } });
  });
  await page.reload();
  for (const [hash, size] of [['#/catalogo/llaveros', 4], ['#/catalogo/polaroid', 8]] as const) {
    await page.evaluate((h) => { location.hash = h; }, hash);
    await page.getByRole('button', { name: /Agregar al carrito/ }).click();
    await page.getByRole('dialog').locator('input[type="file"]').setInputFiles({ name: 'image.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(size, 1) });
    await page.getByRole('dialog').getByRole('button', { name: /Agregar al carrito/ }).click();
  }
  await page.evaluate(() => { location.hash = '#/pedido'; });
  await page.getByLabel(/^Nombre/).fill('Ana');
  await page.getByRole('button', { name: /Preparar mensaje/ }).click();
  await page.getByTestId('share-photo').click();
  await expect(page.getByTestId('share-photo')).toHaveText(/las fotos/);
  const shared = await page.evaluate(() => (window as unknown as { __shared: number[][] }).__shared);
  expect(shared).toEqual([[4, 8]]);
});

test('después de recargar, avisa que la foto ya no está y pide adjuntarla', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
  });
  await page.reload();
  await page.evaluate(() => { location.hash = '#/catalogo/llaveros'; });
  await page.getByRole('button', { name: /Agregar al carrito/ }).click();
  await page.getByRole('dialog').locator('input[type="file"]').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from([137, 80, 78, 71]) });
  await page.getByRole('dialog').getByRole('button', { name: /Agregar al carrito/ }).click();
  await page.goto('./#/pedido');
  await page.reload();
  await page.getByLabel(/^Nombre/).fill('Ana');
  await page.getByRole('button', { name: /Preparar mensaje/ }).click();
  await expect(page.getByTestId('reference-photo')).toContainText('La foto ya no está disponible');
  await expect(page.getByTestId('share-photo')).toHaveCount(0);
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

test('las tarjetas no recortan títulos ni precios en ningún ancho', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Se recorren anchos de tableta y escritorio de forma explícita');
  const hashes = ['#/catalogo', '#/catalogo/forros', '#/catalogo/llaveros', '#/catalogo/polaroid', '#/catalogo/tarjetas-presentacion', '#/catalogo/stickers', '#/catalogo/otros', '#/catalogo/retablos', '#/catalogo/pendones'];
  for (const width of [360, 768, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const hash of hashes) {
      await page.goto(`./${hash}`);
      const clipped = await page.evaluate(() => {
        const out: string[] = [];
        for (const card of Array.from(document.querySelectorAll<HTMLElement>('[data-testid="product-card"]'))) {
          const box = card.getBoundingClientRect();
          for (const el of Array.from(card.querySelectorAll<HTMLElement>('.card__body *'))) {
            if (!el.textContent?.trim() || el.children.length > 0 || el.closest('.sr-only')) continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0) continue;
            if (r.right > box.right + 0.5 || r.left < box.left - 0.5 || el.scrollWidth > el.clientWidth + 1) out.push(el.textContent.trim().slice(0, 40));
          }
        }
        return out;
      });
      expect(clipped, `${hash} @ ${width}px`).toEqual([]);
    }
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('./#/catalogo/forros');
  const prices = page.locator('.variant__price');
  await expect(prices).toHaveText(['$25.000', '$25.000']);
  await prices.first().scrollIntoViewIfNeeded();
  await expect(prices.first()).toBeInViewport({ ratio: 1 });
});

test('un enlace mal codificado o un pedido guardado corrupto no dejan la página en blanco', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./#/catalogo/%E0%A4%A');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('No encontramos esta página');
  await page.evaluate(() => localStorage.setItem('sr.lastOrder.v1', JSON.stringify({ reference: 'X', lines: [{}] })));
  await page.goto('./#/seguimiento');
  await page.reload();
  await expect(page.getByText('Aún no has preparado un pedido en este navegador')).toBeVisible();
  expect(errors).toEqual([]);
});

test('el subtotal del diálogo se actualiza mientras se escribe la cantidad', async ({ page }) => {
  await page.goto('./#/catalogo/llaveros');
  await page.getByRole('button', { name: /Agregar al carrito/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Cantidad', { exact: true }).fill('25');
  await expect(dialog.getByText('$300.000')).toBeVisible();
});

test('cada página restablece su descripción', async ({ page }) => {
  await page.goto('./#/contacto');
  const desc = page.locator('meta[name="description"]');
  await expect(desc).toHaveAttribute('content', /WhatsApp al 301 380 4470/);
  await page.goto('./#/preguntas-frecuentes');
  await expect(desc).not.toHaveAttribute('content', /WhatsApp al 301 380 4470/);
});

test('el carrito se sincroniza entre pestañas', async ({ page, context }) => {
  await page.goto('./#/carrito');
  const other = await context.newPage();
  await other.goto('./#/catalogo/polaroid');
  await other.getByRole('button', { name: /Agregar al carrito/ }).click();
  await other.getByRole('dialog').getByRole('button', { name: /Agregar al carrito/ }).click();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
  await expect(page.getByTestId('cart-total')).toHaveText('$3.000');
  await other.close();
});

test('menú móvil: Escape devuelve el foco, Tab no se escapa y el enlace actual lo cierra', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Solo móvil');
  await page.goto('./#/contacto');
  await page.reload();
  const button = page.locator('button[aria-controls="menu-movil"]');
  await button.click();
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
  await expect(page.locator('#menu-movil')).toBeHidden();
  await button.click();
  for (let i = 0; i < 30; i++) await page.keyboard.press('Tab');
  const inside = await page.evaluate(() => {
    const a = document.activeElement;
    return !!a && (a.closest('#menu-movil') !== null || a.getAttribute('aria-controls') === 'menu-movil');
  });
  expect(inside).toBe(true);
  await page.locator('#menu-movil').getByRole('link', { name: 'Contacto' }).click();
  await expect(page.locator('#menu-movil')).toBeHidden();
  expect(await page.evaluate(() => document.body.classList.contains('no-scroll'))).toBe(false);
});

test('al cerrar el diálogo el foco vuelve al botón que lo abrió', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Prueba de teclado solo en escritorio');
  await page.goto('./#/catalogo/retablos');
  const opener = page.locator('[data-variant="40x40"]').getByRole('button', { name: /Agregar/ });
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await opener.press('Enter');
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click();
  await expect(opener).toBeFocused();
  await opener.press('Enter');
  await page.getByRole('dialog').getByRole('button', { name: /Agregar al carrito/ }).click();
  await expect(opener).toBeFocused();
});

test('seguimiento muestra el pedido preparado antes de abrir WhatsApp', async ({ page }) => {
  await page.goto('./#/catalogo/polaroid');
  await page.getByRole('button', { name: /Agregar al carrito/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Agregar al carrito/ }).click();
  await page.goto('./#/pedido');
  await page.getByLabel(/^Nombre/).fill('Ana');
  await page.getByRole('button', { name: /Preparar mensaje/ }).click();
  await page.getByRole('button', { name: 'Ver seguimiento del pedido' }).click();
  await expect(page.getByTestId('tracking-status')).toHaveText('Estado: Carrito preparado');
});
