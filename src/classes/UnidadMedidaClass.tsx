export class UnidadMedida {
    id?: number;
    denominacion: string;

    constructor(
        denominacion: string,
        id?: number
    ) {
        this.denominacion = denominacion;
        this.id = id;
    }
}