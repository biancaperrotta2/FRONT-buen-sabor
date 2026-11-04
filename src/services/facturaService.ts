import { apiFetch, apiFetchJson } from "../api/client";
import { construirQueryTabla, type PageResponse, type ParametrosTabla } from "./paginacion";

// Escape hatch manual (fuera del flujo automático al marcar ENTREGADO+PAGADO):
// lo usa el cajero para facturar una venta en efectivo, que nunca pasa por PAGADO.
export function generarFacturaDesdePedido(idPedido: number): Promise<unknown> {
  return apiFetchJson(`/facturas/pedido/${idPedido}`, { method: "POST" });
}

export interface Factura {
  idFactura: number;
  idPedido: number;
  idCliente: number;
  nombreCliente: string | null;
  fecha: string;
  total: number;
  numeroFactura: string;
}

export function listarFacturas(params: ParametrosTabla): Promise<PageResponse<Factura>> {
  return apiFetchJson<PageResponse<Factura>>(`/facturas?${construirQueryTabla(params)}`);
}

// El endpoint exige el JWT en el header Authorization, así que no alcanza con un
// <a href> directo: se pide el PDF ya autenticado y se abre desde un blob local.
// La pestaña se abre ANTES del fetch (todavía dentro del gesto de click real del
// usuario) y recién después se le asigna la URL del blob — si se abre recién
// después del await, el navegador lo trata como popup no solicitado y lo bloquea.
export async function abrirFacturaPdf(idFactura: number): Promise<void> {
  const ventana = window.open("", "_blank");
  try {
    const res = await apiFetch(`/facturas/${idFactura}/pdf`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (ventana) {
      ventana.location.href = url;
    } else {
      window.open(url, "_blank");
    }
  } catch (e) {
    ventana?.close();
    throw e;
  }
}

// Para el cliente, desde "Mis pedidos": mismo patrón que abrirFacturaPdf,
// pero identificando la factura por el pedido (el cliente no conoce el idFactura).
export async function abrirFacturaPorPedido(idPedido: number): Promise<void> {
  const ventana = window.open("", "_blank");
  try {
    const res = await apiFetch(`/facturas/pedido/${idPedido}/pdf`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (ventana) {
      ventana.location.href = url;
    } else {
      window.open(url, "_blank");
    }
  } catch (e) {
    ventana?.close();
    throw e;
  }
}
