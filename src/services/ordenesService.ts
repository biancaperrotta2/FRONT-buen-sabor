import { apiFetch, apiFetchJson } from "../api/client";
import { construirQueryTabla, type PageResponse, type ParametrosTabla } from "./paginacion";
import type { EstadoPagoApi, EstadoPedidoApi, FormaPagoApi, ItemCocina, TipoEnvioApi } from "./pedidoService";

// Fila de las tablas de Órdenes (cajero/admin) y Cocina (figuras 32 y 36).
export interface PedidoFila {
  id: number;
  fechaPedido: string;
  horaEstimadaFinalizacion: string;
  cliente: string | null;
  tipoEnvio: TipoEnvioApi;
  estado: EstadoPedidoApi;
  estadoPago: EstadoPagoApi;
  formaPago: FormaPagoApi;
  total: number;
}

// Todo lo del diálogo de una orden (figuras 33 a 38).
export interface PedidoGestion {
  id: number;
  fechaPedido: string;
  horaEstimadaFinalizacion: string;
  estado: EstadoPedidoApi;
  estadoPago: EstadoPagoApi;
  formaPago: FormaPagoApi;
  tipoEnvio: TipoEnvioApi;
  total: number;
  gastosEnvio: number | null;
  descuento: number | null;
  direccionEnvio: string | null;
  cliente: { nombre: string; email: string | null; telefono: string | null } | null;
  repartidor: { nombre: string; telefono: string | null } | null;
  historial: { estado: EstadoPedidoApi; fecha: string; usuario: string }[];
  pago: { transaccion: string | null; metodo: string; monto: number; fecha: string | null };
  aclaraciones: string | null;
  items: (ItemCocina & { imagenUrl: string | null })[];
  idFactura: number | null;
  motivoCancelacion: string | null;
  reintegroPendiente: boolean | null;
  // Estados a los que el usuario logueado puede pasar el pedido (lo decide el backend por rol).
  estadosPermitidos: EstadoPedidoApi[];
}

export function listarOrdenes(params: ParametrosTabla, estado: EstadoPedidoApi | ""): Promise<PageResponse<PedidoFila>> {
  const filtro = estado ? `&estado=${estado}` : "";
  return apiFetchJson(`/pedidos/gestion?${construirQueryTabla(params)}${filtro}`);
}

export function listarCocinaTabla(params: ParametrosTabla): Promise<PageResponse<PedidoFila>> {
  return apiFetchJson(`/pedidos/cocina/tabla?${construirQueryTabla(params)}`);
}

export function obtenerGestion(idPedido: number): Promise<PedidoGestion> {
  return apiFetchJson(`/pedidos/${idPedido}/gestion`);
}

// Vista previa HTML de la factura (pestaña Factura). Va con el token, por eso no alcanza un <iframe src>.
export async function obtenerVistaPreviaFactura(idFactura: number): Promise<string> {
  const res = await apiFetch(`/facturas/${idFactura}/preview`);
  return res.text();
}
