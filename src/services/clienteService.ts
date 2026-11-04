import { apiFetchJson } from "../api/client";
import type { PedidoResumen } from "./pedidoService";
import { construirQueryTabla, type PageResponse, type ParametrosTabla } from "./paginacion";

export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  activo: boolean;
  pedidos: PedidoResumen[];
}

export function listarClientes(params: ParametrosTabla): Promise<PageResponse<Cliente>> {
  return apiFetchJson<PageResponse<Cliente>>(`/clientes?${construirQueryTabla(params)}`);
}

export function desactivarCliente(id: number): Promise<void> {
  return apiFetchJson<void>(`/clientes/${id}`, { method: "DELETE" });
}

export function reactivarCliente(id: number): Promise<void> {
  return apiFetchJson<void>(`/clientes/${id}/activar`, { method: "PUT" });
}
