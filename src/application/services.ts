/**
 * Composición: aquí se eligen los adaptadores concretos. Cambiar WhatsApp por otro
 * canal o activar una pasarela de pagos se hace en este archivo, sin tocar la interfaz.
 */
import { createHttpPaymentGateway } from '../adapters/payments/httpPaymentGateway';
import { unavailablePaymentGateway } from '../adapters/payments/unavailablePaymentGateway';
import { createLocalCartRepository } from '../adapters/storage/localCartRepository';
import { createLocalOrderHistory } from '../adapters/storage/localOrderHistory';
import { createWhatsAppOrderChannel } from '../adapters/whatsapp/whatsappOrderChannel';
import { env } from '../config/env';

export const services = {
  cartRepository: createLocalCartRepository(),
  orderHistory: createLocalOrderHistory(),
  orderChannel: createWhatsAppOrderChannel(env.whatsappNumber),
  payments: env.paymentsEnabled && env.ordersApiUrl ? createHttpPaymentGateway(env.ordersApiUrl) : unavailablePaymentGateway,
};
