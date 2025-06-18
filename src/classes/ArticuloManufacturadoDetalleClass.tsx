import { ArticuloInsumo } from "./ArticuloInsumoClass";


export class ArticuloManufacturadoDetalle {
  id?: number;
  cantidad: number;
  articuloInsumo: ArticuloInsumo;

  constructor(cantidad: number, articuloInsumo: ArticuloInsumo, id?: number) {
    this.id = id;
    this.cantidad = cantidad;
    this.articuloInsumo = articuloInsumo;
  }
}
