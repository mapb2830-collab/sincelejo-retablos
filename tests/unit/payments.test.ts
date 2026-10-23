import { describe, expect, it, vi } from 'vitest';
import { createHttpPaymentGateway } from '../../src/adapters/payments/httpPaymentGateway';
import { unavailablePaymentGateway } from '../../src/adapters/payments/unavailablePaymentGateway';

describe('capa de pagos (fase 2, preparada)', () => {
  it('en la fase 1 la pasarela no está disponible y falla de forma explícita', async () => {
    expect(unavailablePaymentGateway.available).toBe(false);
    await expect(unavailablePaymentGateway.startCheckout({ orderReference: 'x', lines: [] })).rejects.toThrow(/no están habilitados/);
  });

  it('el adaptador HTTP envía solo ids y cantidades, nunca precios', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ redirectUrl: 'https://checkout.example/abc', orderReference: 'SR-1' }), { status: 200 }));
    const gw = createHttpPaymentGateway('https://api.example/', fetchMock as unknown as typeof fetch);
    const lines = [{ productId: 'llavero', variantId: 'unidad', quantity: 2, price: 1 } as never];
    const res = await gw.startCheckout({ orderReference: 'SR-1', lines });
    expect(res.redirectUrl).toBe('https://checkout.example/abc');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.example/orders');
    expect(JSON.parse(String(init.body))).toEqual({ orderReference: 'SR-1', lines: [{ productId: 'llavero', variantId: 'unidad', quantity: 2 }] });
  });

  it('rechaza redirecciones que no sean https', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ redirectUrl: 'javascript:alert(1)' }), { status: 200 }));
    const gw = createHttpPaymentGateway('https://api.example', fetchMock as unknown as typeof fetch);
    await expect(gw.startCheckout({ orderReference: 'SR-1', lines: [] })).rejects.toThrow(/inválida/);
  });
});
