import { env } from "@/env.mjs";

/**
 * Active checkout payment provider.
 *
 * Mercado Pago code (the client form, the `src/lib/mercado-pago-orders/*` helpers,
 * the `submitMercadoPagoCheckoutPayment` action, …) is kept in the codebase and is
 * only reached when this resolves to `"mercado_pago"`. Flip
 * `NEXT_PUBLIC_PAYMENTS_PROVIDER` to `"asaas"` to route the checkout to the Asaas
 * form, or `"disabled"` to show a maintenance notice.
 */
export type PaymentProvider = "mercado_pago" | "asaas" | "disabled";

export const PAYMENTS_PROVIDER: PaymentProvider = env.NEXT_PUBLIC_PAYMENTS_PROVIDER;

export const isMercadoPagoActive = PAYMENTS_PROVIDER === "mercado_pago";
export const isAsaasActive = PAYMENTS_PROVIDER === "asaas";
export const isCheckoutPaymentEnabled = PAYMENTS_PROVIDER !== "disabled";

export const ASAAS_ENV = env.NEXT_PUBLIC_ASAAS_ENV;
