import type { CategoriaPadreDto } from "../pages/Categorias";

export class Categoria {
    id?: number;
    denominacion: string;
    categoriaPadre: CategoriaPadreDto | null;
    
    constructor(
        denominacion: string,
        categoriaPadre: CategoriaPadreDto | null,
        id?: number,
    ) {
        this.id = id;
        this.denominacion = denominacion;
        this.categoriaPadre =  categoriaPadre ?? null;
    }
}
