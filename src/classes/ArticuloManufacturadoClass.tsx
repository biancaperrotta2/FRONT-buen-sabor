import { Articulo } from "./ArticuloClass";
import { ArticuloManufacturadoDetalle } from "./ArticuloManufacturadoDetalleClass";
import { UnidadMedida } from "./UnidadMedidaClass";
import { Categoria } from "./CategoriaClass";

export class ArticuloManufacturado extends Articulo {
  descripcion: string;
  tiempoEstimado: number;
  preparacion: string;
  articuloManufacturadoDetalles: ArticuloManufacturadoDetalle[];

  constructor(
    denominacion: string,
    precioVenta: number,
    unidadMedida: UnidadMedida,
    categoria: Categoria,
    descripcion: string,
    tiempoEstimado: number,
    preparacion: string,
    articuloManufacturadoDetalles: ArticuloManufacturadoDetalle[] = [],
    imagen: string,
    activo: boolean = true,
    id?: number
  ) {
    super(denominacion, precioVenta, unidadMedida, categoria, imagen, activo, id);
    this.descripcion = descripcion;
    this.tiempoEstimado = tiempoEstimado;
    this.preparacion = preparacion;
    this.articuloManufacturadoDetalles = articuloManufacturadoDetalles;
  }
}
