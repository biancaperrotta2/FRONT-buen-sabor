import { apiFetchJson } from "../api/client";
import { construirQueryTabla, type PageResponse, type ParametrosTabla } from "./paginacion";

export type RolApi = "ADMIN" | "EMPLEADO" | "CAJERO" | "REPARTIDOR" | "COCINERO";

export interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo: RolApi;
  activo: boolean;
}

export interface NuevoEmpleado {
  nombre: string;
  apellido: string;
  usuario: string;
  telefono: string;
  email: string;
  password: string;
  rol: RolApi;
}

export function listarEmpleados(params: ParametrosTabla): Promise<PageResponse<Empleado>> {
  return apiFetchJson<PageResponse<Empleado>>(`/empleados?${construirQueryTabla(params)}`);
}

export function crearEmpleado(data: NuevoEmpleado): Promise<unknown> {
  return apiFetchJson("/empleados", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function desactivarEmpleado(id: number): Promise<void> {
  return apiFetchJson<void>(`/empleados/${id}`, { method: "DELETE" });
}

export function reactivarEmpleado(id: number): Promise<void> {
  return apiFetchJson<void>(`/empleados/${id}/activar`, { method: "PUT" });
}
