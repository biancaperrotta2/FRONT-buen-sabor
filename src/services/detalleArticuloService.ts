import { apiFetchJson } from "../api/client";

interface CategoriaDetalle {
  id: number;
  nombre: string;
  categoriaPadre: { id: number; denominacion: string } | null;
}

// GET /articulo-manufacturado/{id}: lo que usa el diálogo "Detalle Catálogo" (figura 53).
export interface ProductoDetalle {
  id: number;
  denominacion: string;
  descripcion: string;
  precioVenta: number | null;
  precioCosto: number | null;
  ganancia: number | null;
  categoria: CategoriaDetalle | null;
  imagenes: { url: string }[];
  detalles: {
    cantidad: number;
    idComponente: number;
    nombreComponente: string;
    // Unidad en que está escrita la cantidad (ej. "gr") y costo por unidad base (kg / l / unidad).
    unidadComponente: string | null;
    costoUnitarioComponente: number | null;
  }[];
  disponible: boolean | null;
  fechaModificacion: string | null;
}

// GET /insumos/{id}: lo que usa el diálogo "Detalle insumo" (figura 66).
export interface InsumoDetalle {
  id: number;
  denominacion: string;
  precioCompra: number | null;
  precioVenta: number | null;
  stockActual: number | null;
  stockMinimo: number | null;
  stockMaximo: number | null;
  esParaElaborar: boolean | null;
  categoria: CategoriaDetalle | null;
  unidadMedida: { denominacion: string; abreviatura: string } | null;
  imagenUrl: string | null;
  nivelStock: "SUFICIENTE" | "ULTIMAS" | "AGOTADO" | null;
  fechaModificacion: string | null;
}

export function obtenerProductoDetalle(id: number): Promise<ProductoDetalle> {
  return apiFetchJson(`/articulo-manufacturado/${id}`);
}

export function obtenerInsumoDetalle(id: number): Promise<InsumoDetalle> {
  return apiFetchJson(`/insumos/${id}`);
}
