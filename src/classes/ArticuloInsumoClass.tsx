import { Articulo } from "./ArticuloClass";
import { UnidadMedida } from "./UnidadMedidaClass";
import { Categoria } from "./CategoriaClass";

export class ArticuloInsumo extends Articulo {
  precioCompra: number;
  margen: number;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  esParaElaborar: boolean;

  constructor(
    denominacion: string,
    precioVenta: number,
    unidadMedida: UnidadMedida,
    categoria: Categoria,
    precioCompra: number,
    stockActual: number,
    stockMaximo: number,
    esParaElaborar: boolean,
    imagen: string,
    activo: boolean = true,
    id?: number,
    margen: number = 0,
    stockMinimo: number = 0
  ) {
    super(
      denominacion,
      precioVenta,
      unidadMedida,
      categoria,
      imagen,
      activo,
      id
    );
    this.precioCompra = precioCompra;
    this.margen = margen;
    this.stockActual = stockActual;
    this.stockMinimo = stockMinimo;
    this.stockMaximo = stockMaximo;
    this.esParaElaborar = esParaElaborar;
  }
}
