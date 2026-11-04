import { apiFetchJson } from "../api/client";

export type Agrupacion = "DIARIO" | "MENSUAL";

export interface RankingProducto {
  idArticulo: number;
  nombreArticulo: string;
  cantidadVendida: number;
}

export interface IngresoPeriodo {
  periodo: string;
  total: number;
}

export interface OrdenesPorCliente {
  idCliente: number;
  nombreCliente: string;
  cantidadOrdenes: number;
}

export interface ArticuloStockBajo {
  id: number;
  denominacion: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: { abreviatura: string } | null;
}

const params = (desde: string, hasta: string, extra?: Record<string, string>) => {
  const p = new URLSearchParams({ desde, hasta, ...extra });
  return p.toString();
};

export function rankingProductos(desde: string, hasta: string): Promise<RankingProducto[]> {
  return apiFetchJson<RankingProducto[]>(`/reportes/ranking-productos?${params(desde, hasta)}`);
}

export function ingresosPorPeriodo(
  desde: string,
  hasta: string,
  agrupacion: Agrupacion
): Promise<IngresoPeriodo[]> {
  return apiFetchJson<IngresoPeriodo[]>(
    `/reportes/ingresos?${params(desde, hasta, { agrupacion })}`
  );
}

export function ordenesPorCliente(desde: string, hasta: string): Promise<OrdenesPorCliente[]> {
  return apiFetchJson<OrdenesPorCliente[]>(`/reportes/ordenes-por-cliente?${params(desde, hasta)}`);
}

export function stockBajo(): Promise<ArticuloStockBajo[]> {
  return apiFetchJson<ArticuloStockBajo[]>("/reportes/stock-bajo");
}

// --- Dashboard de Administración ---

export type CategoriaStockApi = "INSUMOS" | "SEMIELABORADOS";
export type NivelStockApi = "SUFICIENTE" | "ULTIMAS" | "AGOTADO";

export interface ArticuloStock {
  id: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  nivel: NivelStockApi;
  categoria: CategoriaStockApi;
}

export function stockPorNivel(
  categoria: CategoriaStockApi,
  nivel: NivelStockApi
): Promise<ArticuloStock[]> {
  const p = new URLSearchParams({ categoria, nivel });
  return apiFetchJson<ArticuloStock[]>(`/reportes/stock?${p.toString()}`);
}

export interface ResumenIngresos {
  cantidadOrdenes: number;
  totalIngresos: number;
}

export function resumenIngresos(desde: string, hasta: string): Promise<ResumenIngresos> {
  return apiFetchJson<ResumenIngresos>(`/reportes/resumen-ingresos?${params(desde, hasta)}`);
}
