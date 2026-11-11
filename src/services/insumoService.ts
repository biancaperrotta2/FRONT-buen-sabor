import { apiFetchJson } from "../api/client";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Categoria, type TipoCategoria } from "../classes/CategoriaClass";
import { UnidadMedida } from "../classes/UnidadMedidaClass";

interface InsumoMenuApi {
  id: number;
  denominacion: string;
  precioVenta: number;
  imagenUrl: string | null;
  categoria: { id: number; denominacion: string; tipo: TipoCategoria } | null;
  disponible?: boolean;
}

// Público: insumos que se venden directo (ej. gaseosas) para el menú del cliente. El backend
// no expone costo ni stock en esta vista, así que esos campos quedan en 0.
export async function listarInsumosVendibles(): Promise<ArticuloInsumo[]> {
  const data = await apiFetchJson<InsumoMenuApi[]>("/insumos/vendibles");
  return data.map((i) => {
    const insumo = new ArticuloInsumo(
      i.denominacion,
      i.precioVenta,
      new UnidadMedida("Unidad"),
      i.categoria
        ? new Categoria(i.categoria.denominacion, null, i.categoria.id, i.categoria.tipo)
        : new Categoria("", null),
      0,
      0,
      0,
      false,
      i.imagenUrl ?? "",
      true,
      i.id
    );
    insumo.disponible = i.disponible ?? true;
    return insumo;
  });
}
