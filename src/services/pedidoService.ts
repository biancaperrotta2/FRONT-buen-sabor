import { apiFetchJson } from "../api/client";

export type TipoEnvioApi = "DELIVERY" | "TAKE_AWAY";
export type FormaPagoApi = "EFECTIVO" | "MERCADO_PAGO";

export interface Domicilio {
  id: number;
  alias: string | null;
  calle: string;
  numero: string;
  ciudad: string;
  costoEnvio: number;
}

export interface Ciudad {
  id: number;
  nombre: string;
  idProvincia: number;
  costoEnvio: number;
}

export interface NuevoDomicilio {
  calle: string;
  numero: string;
  cp?: string;
  piso?: string;
  nroDepto?: string;
  idCiudad: number;
  aclaraciones?: string;
  alias?: string;
}

export function misDomicilios(): Promise<Domicilio[]> {
  return apiFetchJson<Domicilio[]>("/clientes/me/domicilios");
}

export function agregarDomicilio(data: NuevoDomicilio): Promise<Domicilio> {
  return apiFetchJson<Domicilio>("/clientes/me/domicilios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function listarCiudades(): Promise<Ciudad[]> {
  return apiFetchJson<Ciudad[]>("/ciudades/all");
}

export interface ItemCarritoLocal {
  idArticulo: number;
  cantidad: number;
}

// El pedido se arma en el backend a partir del carrito PERSISTIDO del cliente, no del
// estado local en memoria del frontend — hay que sincronizarlos justo antes de crear
// el pedido. Se vacía primero por si había quedado algo de un intento anterior.
export async function sincronizarCarrito(items: ItemCarritoLocal[]): Promise<void> {
  await apiFetchJson("/carrito", { method: "DELETE" });
  for (const item of items) {
    await apiFetchJson("/carrito/items", {
      method: "POST",
      body: JSON.stringify({ idArticulo: item.idArticulo, cantidad: item.cantidad }),
    });
  }
}

export interface PedidoRequestApi {
  tipoEnvio: TipoEnvioApi;
  formaPago: FormaPagoApi;
  idDomicilio?: number | null;
  aclaracionDomicilio?: string;
  aclaraciones?: string;
}

export interface PedidoCreado {
  id: number;
  estadoPedido: string;
  estadoPago: string;
  fechaPedido: string;
  tipoEnvio: TipoEnvioApi;
  formaPago: FormaPagoApi;
  domicilioSnapshot: string;
  horaEstimadaFinalizacion: string;
  costoTotal: number;
  gastosEnvio: number | null;
  descuento: number | null;
  total: number;
}

export function crearPedido(request: PedidoRequestApi): Promise<PedidoCreado> {
  return apiFetchJson<PedidoCreado>("/pedidos", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export interface PreferenciaPago {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export function crearPreferenciaPago(idPedido: number): Promise<PreferenciaPago> {
  return apiFetchJson<PreferenciaPago>(`/pedidos/${idPedido}/pago/preferencia`, {
    method: "POST",
  });
}

export type EstadoPedidoApi =
  | "PENDIENTE"
  | "EN_PROCESO"
  | "DEMORADO"
  | "PREPARADO"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO";

export type EstadoPagoApi = "PENDIENTE" | "PAGADO" | "RECHAZADO" | "REINTEGRADO";

export interface DetallePedidoResumen {
  articuloManufacturado: { id: number; denominacion: string } | null;
  // Viene para cualquier artículo (plato, promoción o insumo vendido directo).
  nombreArticulo: string | null;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoResumen {
  id: number;
  estadoPedido: EstadoPedidoApi;
  estadoPago: EstadoPagoApi;
  horaEstimadaFinalizacion: string;
  fechaPedido: string;
  tipoEnvio: TipoEnvioApi;
  formaPago: FormaPagoApi;
  domicilioSnapshot: string;
  total: number;
  idFactura: number | null;
  // Lo escribe el cajero al rechazar el pedido.
  motivoCancelacion: string | null;
  detalles: DetallePedidoResumen[];
}

export function misPedidos(): Promise<PedidoResumen[]> {
  return apiFetchJson<PedidoResumen[]>("/pedidos/mios");
}

// --- Repartidor ---

export interface PedidoEntrega {
  id: number;
  estadoPedido: EstadoPedidoApi;
  domicilioSnapshot: string;
  aclaracionDomicilio: string | null;
  total: number;
  formaPago: FormaPagoApi;
  estadoPago: EstadoPagoApi;
  horaEstimadaFinalizacion: string;
}

// Pool de pedidos PREPARADO + DELIVERY que ningún repartidor tomó todavía.
export function pedidosDisponiblesEnvio(): Promise<PedidoEntrega[]> {
  return apiFetchJson<PedidoEntrega[]>("/pedidos/disponibles-envio");
}

// Pedidos que este repartidor ya tomó y todavía no marcó como entregados.
export function misEntregas(): Promise<PedidoEntrega[]> {
  return apiFetchJson<PedidoEntrega[]>("/pedidos/mis-entregas");
}

export function tomarPedido(idPedido: number): Promise<PedidoEntrega> {
  return apiFetchJson<PedidoEntrega>(`/pedidos/${idPedido}/tomar`, { method: "PATCH" });
}

export function marcarEntregado(idPedido: number): Promise<PedidoEntrega> {
  return apiFetchJson<PedidoEntrega>(`/pedidos/${idPedido}/entregar`, { method: "PATCH" });
}

// Confirma que se cobró en efectivo (mostrador o puerta). Paso separado de marcar la
// entrega; un pedido con Mercado Pago se paga solo, nunca pasa por acá.
export function confirmarCobroEfectivo(idPedido: number): Promise<unknown> {
  return apiFetchJson(`/pedidos/${idPedido}/pago/confirmar`, { method: "PATCH" });
}

export interface VerificacionPago {
  idPedido: number;
  estadoPago: EstadoPagoApi;
  // false = Mercado Pago todavía no registra ningún pago para ese pedido.
  pagoEncontrado: boolean;
}

// Le pregunta al backend (que le pregunta a Mercado Pago) cómo salió el pago del pedido, sin
// depender de que haya llegado el webhook.
export function verificarPagoMercadoPago(idPedido: number): Promise<VerificacionPago> {
  return apiFetchJson<VerificacionPago>(`/pedidos/${idPedido}/pago/verificar`, { method: "POST" });
}

// --- Cocinero ---

// Si es una promoción, "incluye" trae lo que hay que preparar (cantidades ya multiplicadas).
export interface ItemCocina {
  nombre: string;
  cantidad: number;
  preparacion: string | null;
  incluye: ItemCocina[];
}

export interface PedidoCocina {
  id: number;
  cliente: { id: number; nombre: string; apellido: string } | null;
  horaEstimadaFinalizacion: string;
  tipoEnvio: TipoEnvioApi;
  estadoPedido: EstadoPedidoApi;
  aclaraciones: string | null;
  items: ItemCocina[];
}

// EN_PROCESO + DEMORADO, ya ordenados por hora estimada (más urgente primero).
export function pedidosParaCocina(): Promise<PedidoCocina[]> {
  return apiFetchJson<PedidoCocina[]>("/pedidos/cocina");
}

export function cambiarEstadoPedido(
  idPedido: number,
  nuevoEstado: EstadoPedidoApi
): Promise<unknown> {
  return apiFetchJson(`/pedidos/${idPedido}/estado`, {
    method: "PUT",
    body: JSON.stringify({ nuevoEstado }),
  });
}

// --- Cajero ---

export interface PedidoCaja {
  id: number;
  cliente: { id: number; nombre: string; apellido: string } | null;
  estadoPedido: EstadoPedidoApi;
  tipoEnvio: TipoEnvioApi;
  formaPago: FormaPagoApi;
  estadoPago: EstadoPagoApi;
  total: number;
  horaEstimadaFinalizacion: string;
  aclaraciones: string | null;
}

// Rechaza un pedido pendiente; si ya estaba pagado con Mercado Pago, el backend reintegra el pago.
export function rechazarPedido(idPedido: number, motivo: string): Promise<unknown> {
  return apiFetchJson(`/pedidos/${idPedido}/rechazar`, {
    method: "PATCH",
    body: JSON.stringify({ motivo }),
  });
}

// Pedidos recién ingresados que el cajero todavía no aceptó.
export function pedidosPendientes(): Promise<PedidoCaja[]> {
  return apiFetchJson<PedidoCaja[]>("/pedidos/pendientes");
}

// PREPARADO + retiro en tienda: listos para entregar y cobrar en el mostrador.
export function pedidosParaEntregarEnLocal(): Promise<PedidoCaja[]> {
  return apiFetchJson<PedidoCaja[]>("/pedidos/para-entregar");
}
