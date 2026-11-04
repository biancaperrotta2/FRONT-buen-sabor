import type { CategoriaPadreDto } from "../pages/Categorias";

// PRODUCTO: lo que ve el cliente en el menú. INSUMO: materia prima agrupada por tipo de
// ingrediente (Lácteos, Carnes...). Cada formulario solo ofrece las de su tipo.
export type TipoCategoria = "PRODUCTO" | "INSUMO";

export class Categoria {
    id?: number;
    denominacion: string;
    categoriaPadre: CategoriaPadreDto | null;
    tipo: TipoCategoria;

    constructor(
        denominacion: string,
        categoriaPadre: CategoriaPadreDto | null,
        id?: number,
        tipo: TipoCategoria = "PRODUCTO",
    ) {
        this.id = id;
        this.denominacion = denominacion;
        this.categoriaPadre =  categoriaPadre ?? null;
        this.tipo = tipo;
    }
}
