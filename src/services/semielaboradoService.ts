import { apiFetch, apiFetchJson } from "../api/client";
import { construirQueryTabla, type PageResponse, type ParametrosTabla } from "./paginacion";

export type NivelStock = "SUFICIENTE" | "ULTIMAS" | "AGOTADO";
// Un semielaborado solo se mide en unidades base (ver ArticuloManufacturadoServiceImpl.unidadMedidaPara).
export type UnidadSemielaborado = "KG" | "L" | "UNIDAD";

export interface SemielaboradoFila {
  id: number;
  denominacion: string;
  imagenUrl: string | null;
  precioCosto: number | null;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  unidadAbreviatura: string;
  nivelStock: NivelStock;
  activo: boolean;
  categoria: { id: number; denominacion: string } | null;
}

export interface IngredienteDetalle {
  cantidad: number;
  idComponente: number;
  nombreComponente: string;
  unidadComponente: string | null;
  // Costo por unidad base (kg / l / unidad) del insumo.
  costoUnitarioComponente: number | null;
}

export interface SemielaboradoDetalle {
  id: number;
  denominacion: string;
  descripcion: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  precioCosto: number | null;
  unidadMedida: string;
  unidadAbreviatura: string;
  // El detalle (CategoriaFullResponse) trae el nombre como "nombre".
  categoria: { id: number; nombre?: string; denominacion?: string } | null;
  imagenes: { url: string }[];
  detalles: IngredienteDetalle[];
}

export type EstadoLote = "VIGENTE" | "AGOTADO" | "VENCIDO" | "DESCARTADO";

export interface Lote {
  id: number;
  fechaElaboracion: string;
  fechaVencimiento: string;
  cantidad: number;
  cantidadRestante: number;
  costoUnitario: number | null;
  costoTotal: number | null;
  estado: EstadoLote;
  // Todavía no se usó en pedidos: solo así se puede corregir o borrar (devuelve insumos).
  editable: boolean;
}

export interface SemielaboradoDatos {
  denominacion: string;
  descripcion: string;
  unidadMedida: UnidadSemielaborado;
  stockMinimo: number;
  stockMaximo: number;
  idCategoria: number;
  categoriaDenominacion: string;
  imagenUrl: string | null;
  // La receta está escrita para 1 unidad del semielaborado (1 kg, 1 l o 1 unidad).
  detalles: { idComponente: number; cantidad: number }[];
}

export function listarSemielaboradosAdmin(params: ParametrosTabla): Promise<PageResponse<SemielaboradoFila>> {
  return apiFetchJson(`/articulo-manufacturado/semielaborados/admin?${construirQueryTabla(params)}`);
}

export function obtenerSemielaborado(id: number): Promise<SemielaboradoDetalle> {
  return apiFetchJson(`/articulo-manufacturado/${id}`);
}

const aRequest = (d: SemielaboradoDatos) => ({
  denominacion: d.denominacion,
  esSemielaborado: true,
  unidadMedida: d.unidadMedida,
  stockMinimo: d.stockMinimo,
  stockMaximo: d.stockMaximo,
  descripcion: d.descripcion,
  imagenes: d.imagenUrl ? [{ denominacion: d.denominacion, url: d.imagenUrl }] : [],
  categoria: { denominacion: d.categoriaDenominacion, idCategoriaPadre: d.idCategoria },
  articuloManufacturadoDetalles: d.detalles,
});

export function crearSemielaborado(datos: SemielaboradoDatos): Promise<unknown> {
  return apiFetchJson("/articulo-manufacturado", { method: "POST", body: JSON.stringify(aRequest(datos)) });
}

export function actualizarSemielaborado(id: number, datos: SemielaboradoDatos): Promise<unknown> {
  return apiFetchJson(`/articulo-manufacturado/${id}`, { method: "PUT", body: JSON.stringify(aRequest(datos)) });
}

export async function eliminarSemielaborado(id: number): Promise<void> {
  await apiFetch(`/articulo-manufacturado/${id}`, { method: "DELETE" });
}

// --- Lotes (existencias) ---

export function listarLotes(idSemielaborado: number): Promise<Lote[]> {
  return apiFetchJson(`/articulo-manufacturado/${idSemielaborado}/existencias`);
}

export interface LoteDatos {
  fechaElaboracion: string | null;
  cantidad: number;
  fechaVencimiento: string;
}

export function crearLote(idSemielaborado: number, datos: LoteDatos): Promise<Lote> {
  return apiFetchJson(`/articulo-manufacturado/${idSemielaborado}/existencias`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function editarLote(idLote: number, datos: LoteDatos): Promise<Lote> {
  return apiFetchJson(`/articulo-manufacturado/existencias/${idLote}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export async function eliminarLote(idLote: number): Promise<void> {
  await apiFetch(`/articulo-manufacturado/existencias/${idLote}`, { method: "DELETE" });
}

export function descartarLote(idLote: number): Promise<Lote> {
  return apiFetchJson(`/articulo-manufacturado/existencias/${idLote}/descartar`, { method: "PATCH" });
}
