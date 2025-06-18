import { UnidadMedida } from "./UnidadMedidaClass";
import { Categoria } from "./CategoriaClass";

export abstract class Articulo {
  id?: number;
  denominacion: string;
  precioVenta: number;
  activo: boolean;
  unidadMedida: UnidadMedida;
  categoria: Categoria;
  imagen: string;

  constructor(
    denominacion: string,
    precioVenta: number,
    unidadMedida: UnidadMedida,
    categoria: Categoria,
    imagen : string,
    activo: boolean = true,
    id?: number
    
  ) {
    this.id = id;
    this.denominacion = denominacion;
    this.precioVenta = precioVenta;
    this.unidadMedida = unidadMedida;
    this.categoria = categoria;
    this.activo = activo;
    this.imagen = imagen
  }
}

