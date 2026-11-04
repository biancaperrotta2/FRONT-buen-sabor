import { apiFetchJson } from "../api/client";
import { Categoria } from "../classes/CategoriaClass";
import { construirQueryTabla, type PageResponse, type ParametrosTabla } from "./paginacion";

// Para la tabla de admin (búsqueda + paginado + orden). No confundir con /categoria/all,
// que sigue trayendo la lista completa sin paginar (la usan los <select> de categoría
// de los formularios de Insumo/Categoría/Producto).
export async function listarCategoriasAdmin(params: ParametrosTabla): Promise<PageResponse<Categoria>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const respuesta = await apiFetchJson<PageResponse<any>>(`/categoria/admin?${construirQueryTabla(params)}`);
  return {
    ...respuesta,
    contenido: respuesta.contenido.map((c) => new Categoria(c.denominacion, c.categoriaPadre, c.id, c.tipo)),
  };
}
