/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_WHATSAPP_NUMBER?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_PAYMENTS_ENABLED?: string;
  readonly VITE_ORDERS_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
