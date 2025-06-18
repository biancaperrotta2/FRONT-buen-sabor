import type { DetallePedido } from "./DetallePedidoClass";

export type TipoEnvio = "TIENDA" | "DELIVERY";
export type FormaPago = "EFECTIVO" | "TARJETA";

export class Pedido {
  id_pedido?: number;
  horaEstimadaFinalizacion?: string;
  estadoPedido?: string;
  subTotal: number;
  descuento: number;
  total: number;
  tipoEnvio: TipoEnvio;
  formaPago: FormaPago;
  fechaPedido: string;
  aclaracionDomicilio?: string;
  detallesPedido: DetallePedido[];
  constructor(
    subTotal: number,
    descuento: number,
    total: number,
    tipoEnvio: TipoEnvio,
    formaPago: FormaPago,
    fechaPedido: string,
    detallesPedido: DetallePedido[],
    aclaracionDomicilio?: string,
    id_pedido?: number,
    horaEstimadaFinalizacion?: string,
    estadoPedido?: string
  ) {
    this.id_pedido = id_pedido;
    this.horaEstimadaFinalizacion = horaEstimadaFinalizacion;
    this.estadoPedido = estadoPedido;
    this.subTotal = subTotal;
    this.descuento = descuento;
    this.total = total;
    this.tipoEnvio = tipoEnvio;
    this.formaPago = formaPago;
    this.fechaPedido = fechaPedido;
    this.aclaracionDomicilio = aclaracionDomicilio;
    this.detallesPedido = detallesPedido;
  }
}
