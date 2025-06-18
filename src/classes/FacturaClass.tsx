import type { DetalleFactura } from "./DetalleFacturaClass";
import type { Pedido } from "./PedidoClass";
import type { FormaPago } from "./PedidoClass"; 

export class Factura {
  id_factura?: number;
  fechaFacturacion: string;
  mpPaymentId?: number;
  mpMerchantOrderId?: number;
  mpPreferenceId?: string;
  mpPaymentType?: string;
  formaPago: FormaPago;
  totalVenta: number;
  pedido: Pedido;
  detallesFactura: DetalleFactura[];

  constructor(
    fechaFacturacion: string,
    formaPago: FormaPago,
    totalVenta: number,
    pedido: Pedido,
    detallesFactura: DetalleFactura[],
    id_factura?: number,
    mpPaymentId?: number,
    mpMerchantOrderId?: number,
    mpPreferenceId?: string,
    mpPaymentType?: string
  ) {
    this.id_factura = id_factura;
    this.fechaFacturacion = fechaFacturacion;
    this.mpPaymentId = mpPaymentId;
    this.mpMerchantOrderId = mpMerchantOrderId;
    this.mpPreferenceId = mpPreferenceId;
    this.mpPaymentType = mpPaymentType;
    this.formaPago = formaPago;
    this.totalVenta = totalVenta;
    this.pedido = pedido;
    this.detallesFactura = detallesFactura;
  }
}
