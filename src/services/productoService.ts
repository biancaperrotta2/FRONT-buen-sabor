import { apiFetchJson } from "../api/client";
import { mapearBase } from "../context/ProductosContext";
import type { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { construirQueryTabla, type PageResponse, type ParametrosTabla } from "./paginacion";

// Para la tabla de admin "Productos" (búsqueda + paginado + orden). No confundir con
// /articulo-manufacturado, que sigue alimentando el catálogo público sin cambios.
export async function listarProductosAdmin(params: ParametrosTabla): Promise<PageResponse<ArticuloManufacturado>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const respuesta = await apiFetchJson<PageResponse<any>>(`/articulo-manufacturado/admin?${construirQueryTabla(params)}`);
  return { ...respuesta, contenido: respuesta.contenido.map(mapearBase) };
}
