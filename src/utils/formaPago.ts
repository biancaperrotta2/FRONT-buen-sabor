import type { FormaPagoApi } from "../services/pedidoService";

// Nombre de cada forma de pago tal como la ve la gente en pantalla.
export const nombreFormaPago = (forma: FormaPagoApi): string =>
  forma === "EFECTIVO" ? "Efectivo" : forma === "CRIPTO" ? "Criptomonedas" : "Mercado Pago";

// Se cobra online antes de preparar el pedido (el cajero no puede aceptarlo sin el pago confirmado).
export const esPagoOnline = (forma: FormaPagoApi): boolean => forma === "MERCADO_PAGO" || forma === "CRIPTO";

// Dónde se cobra y, si hace falta, se devuelve: Mercado Pago o la pasarela de criptomonedas
// (la simulada o CoinGate, según la configuración del backend).
export const nombrePasarela = (forma: FormaPagoApi): string => (forma === "CRIPTO" ? "la pasarela cripto" : "Mercado Pago");
