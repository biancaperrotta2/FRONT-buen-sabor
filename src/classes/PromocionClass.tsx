  import { TipoPromocion } from "./TipoPromocionClass"; 

  export class Promocion {
    id?: number;
    denominacion: string;
    fechaDesde: string; 
    fechaHasta: string;
    horaDesde: string; 
    horaHasta: string;
    descripcionDescuento: string;
    precioPromocional: number;
    imagen: string;
    tipoPromocion: TipoPromocion;
    // false = falta stock de algo que incluye (tarjeta "Sin stock" en el menú).
    disponible: boolean = true;

    constructor(
      denominacion: string,
      fechaDesde: string,
      fechaHasta: string,
      horaDesde: string,
      horaHasta: string,
      descripcionDescuento: string,
      precioPromocional: number,
      imagen: string,
      tipoPromocion: TipoPromocion,
      id?: number
    ) {
      this.id = id;
      this.denominacion = denominacion;
      this.fechaDesde = fechaDesde;
      this.fechaHasta = fechaHasta;
      this.horaDesde = horaDesde;
      this.horaHasta = horaHasta;
      this.descripcionDescuento = descripcionDescuento;
      this.precioPromocional = precioPromocional;
      this.imagen = imagen;
      this.tipoPromocion = tipoPromocion;
    }
  }
