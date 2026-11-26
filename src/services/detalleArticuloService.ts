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

// ---------- Existencias (compras) de un insumo: historias #27 y #28, figuras 66 y 67 ----------

// cantidad en la unidad que el insumo tiene elegida (ej. gr); costoUnitario por unidad base (ej. $ x kg).
export interface ExistenciaInsumo {
  id: number;
  fechaCompra: string;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  fechaVencimiento: string;
  vencida: boolean;
}

export interface ExistenciaInsumoDatos {
  fechaCompra: string;
  cantidad: number;
  costoUnitario: number;
  fechaVencimiento: string;
}

export function listarExistenciasInsumo(idInsumo: number): Promise<ExistenciaInsumo[]> {
  return apiFetchJson(`/insumos/${idInsumo}/existencias`);
}

export function crearExistenciaInsumo(idInsumo: number, datos: ExistenciaInsumoDatos): Promise<ExistenciaInsumo> {
  return apiFetchJson(`/insumos/${idInsumo}/existencias`, { method: "POST", body: JSON.stringify(datos) });
}

export function editarExistenciaInsumo(idExistencia: number, datos: ExistenciaInsumoDatos): Promise<ExistenciaInsumo> {
  return apiFetchJson(`/insumos/existencias/${idExistencia}`, { method: "PUT", body: JSON.stringify(datos) });
}

export function eliminarExistenciaInsumo(idExistencia: number): Promise<void> {
  return apiFetchJson(`/insumos/existencias/${idExistencia}`, { method: "DELETE" });
}
