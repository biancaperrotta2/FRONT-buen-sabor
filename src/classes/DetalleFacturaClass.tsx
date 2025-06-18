export class DetalleFactura {
  id_detalleFactura?: number;
  cantidad: number;
  subTotal: number;

  constructor(
    cantidad: number,
    subTotal: number,
    id_detalleFactura?: number
  ) {
    this.id_detalleFactura = id_detalleFactura;
    this.cantidad = cantidad;
    this.subTotal = subTotal;
  }
}
