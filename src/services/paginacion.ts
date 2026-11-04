// Tipos y helpers compartidos por toda tabla de admin con búsqueda + paginado + orden
// real de backend (Spring Pageable). "pagina" es 0-based, igual que Spring Data.

export interface PageResponse<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
}

export type Direccion = "asc" | "desc" | null;

export interface ParametrosTabla {
  busqueda: string;
  pagina: number;
  tamanio: number;
  ordenarPor: string | null;
  direccion: Direccion;
}

export function construirQueryTabla(params: ParametrosTabla): string {
  const query = new URLSearchParams({
    busqueda: params.busqueda,
    page: String(params.pagina),
    size: String(params.tamanio),
  });
  if (params.ordenarPor && params.direccion) {
    query.set("sort", `${params.ordenarPor},${params.direccion}`);
  }
  return query.toString();
}
