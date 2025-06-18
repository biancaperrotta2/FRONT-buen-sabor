import { Empresa } from "./EmpresaClass"; // Asegurate de crear esta clase también

export class Sucursal {
  id?: number;
  nombre: string;
  horaApertura: string; // formato "HH:mm:ss"
  horaCierre: string; // formato "HH:mm:ss"
  empresa: Empresa;
  activo: boolean;

  constructor(
    nombre: string,
    horaApertura: string,
    horaCierre: string,
    empresa: Empresa,
    activo: boolean = true,
    id?: number
  ) {
    this.id = id;
    this.nombre = nombre;
    this.horaApertura = horaApertura;
    this.horaCierre = horaCierre;
    this.empresa = empresa;
    this.activo = activo;
  }
}
