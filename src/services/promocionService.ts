import { apiFetchJson } from "../api/client";
import { Promocion } from "../classes/PromocionClass";
import { TipoPromocion } from "../classes/TipoPromocionClass";
import { urlDeImagen } from "../utils/imagen";
import { construirQueryTabla, type PageResponse, type ParametrosTabla } from "./paginacion";

export type TipoPromocionApi = "HAPPY_HOUR" | "VERANO" | "INVIERNO";

export interface PromocionAdminRow {
  id: number;
  nombre: string;
  precioVenta: number;
  descripcionDescuento: string;
  urlImagen: string | null;
  activo: boolean;
}

export interface PromocionDetalleFull {
  idArticulo: number;
  nombreArticulo: string;
  cantidad: number;
  precioUnitario: number;
}

export interface PromocionFull {
  id: number;
  nombre: string;
  descripcionDescuento: string;
  fechaDesde: string;
  fechaHasta: string;
  horaDesde: string;
  horaHasta: string;
  precioTotal: number;
  precioVenta: number;
  precioCosto: number;
  activo: boolean;
  tipoPromocion: TipoPromocionApi;
  nombreCategoria: string | null;
  detalles: PromocionDetalleFull[];
  imagenes: { url: string }[];
}

export interface PromocionRequestDto {
  nombre: string;
  descripcionDescuento: string;
  fechaDesde: string;
  fechaHasta: string;
  horaDesde: string;
  horaHasta: string;
  precioVenta: number;
  tipoPromocion: TipoPromocionApi;
  idCategoria: number;
  detalles: { idArticulo: number; cantidad: number }[];
  imagenesUrls: string[];
}

// Promociones vigentes para el menú público del cliente.
export async function listarPromocionesVigentes(): Promise<Promocion[]> {
  const data = await apiFetchJson<PromocionAdminRow[]>("/promociones");
  return data.map(
    (p) =>
      new Promocion(
        p.nombre,
        "",
        "",
        "",
        "",
        p.descripcionDescuento,
        p.precioVenta,
        urlDeImagen(p.urlImagen) ?? "",
        new TipoPromocion(""),
        p.id
      )
  );
}

// Para la tabla de admin "Promociones": búsqueda + paginado + orden.
export function listarPromocionesAdmin(params: ParametrosTabla): Promise<PageResponse<PromocionAdminRow>> {
  return apiFetchJson<PageResponse<PromocionAdminRow>>(`/promociones/admin?${construirQueryTabla(params)}`);
}

export function obtenerPromocion(id: number): Promise<PromocionFull> {
  return apiFetchJson<PromocionFull>(`/promociones/${id}`);
}

export function crearPromocion(dto: PromocionRequestDto): Promise<PromocionFull> {
  return apiFetchJson<PromocionFull>("/promociones", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function actualizarPromocion(id: number, dto: PromocionRequestDto): Promise<PromocionFull> {
  return apiFetchJson<PromocionFull>(`/promociones/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export function cambiarEstadoHabilitacionPromocion(id: number): Promise<void> {
  return apiFetchJson<void>(`/promociones/${id}/habilitar`, { method: "PATCH" });
}
