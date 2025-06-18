import type { ArticuloInsumo } from "./ArticuloInsumoClass";
import type { ArticuloManufacturado } from "./ArticuloManufacturadoClass";

export type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo;

export class DetallePedido {
  id_detallePedido?: number;
  cantidad: number;
  totalArticulo: number;
  articulo: ArticuloMenu; // relación directa al artículo pedido


  constructor(
    cantidad: number,
    totalArticulo: number,
    articulo: ArticuloMenu, // relación directa al artículo pedido
    id_detallePedido?: number
  ) {
    this.id_detallePedido = id_detallePedido;
    this.cantidad = cantidad;
    this.totalArticulo = totalArticulo;
    this.articulo = articulo;
  }
}
