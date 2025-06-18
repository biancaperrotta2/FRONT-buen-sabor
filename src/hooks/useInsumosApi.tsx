import { useState, useEffect } from "react";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { UnidadMedida } from "../classes/UnidadMedidaClass";
import { Categoria } from "../classes/CategoriaClass";
import type { InsumoRecord } from "../components/FormularioInsumo";
import type { InsumoDto } from "../pages/Insumo";

export function useInsumosApi() {
    const [insumos, setInsumos] = useState<ArticuloInsumo[]>([]);
    const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);

    const fetchInsumos = async () => {
        try {
        const res = await fetch("http://localhost:8080/articulo-insumo/all");
        if (!res.ok) throw new Error("Error al obtener insumos");
        const data = await res.json();
        const instancias = data.map(
            (item: any) =>
            new ArticuloInsumo(
                item.denominacion,
                item.precioVenta,
                item.precioCompra,
                item.stockActual,
                item.stockMaximo,
                item.esParaElaborar,
                item.unidadMedida,
                item.categoria,
                item.id
            )
        );
        setInsumos(instancias);
        } catch (error) {
        console.error("Error al obtener insumos:", error);
        }
    };

    const fetchUnidadesMedida = async () => {
        console.log("BUSCANDO UNIDADES DE MEDIDA")
        try {
        const res = await fetch("http://localhost:8080/unidad-medida/all");
        if (!res.ok) throw new Error("Error al obtener unidades de medida");
        const data = await res.json();
        const instancias = data.map(
            (item: any) =>
            new UnidadMedida(
                item.denominacion,
                item.id,
            )
        );
        console.log("Unidades obtenidas:", instancias);
        setUnidadesMedida(instancias);
        } catch (error) {
        console.error("Error al obtener unidades de medida:", error);
        }
    };

    const agregarInsumo = async (nuevo: InsumoDto) => {

        const insumoNew: InsumoRecord = {
            denominacion: nuevo.denominacion,
            precioVenta: Number(nuevo.precioVenta),
            precioCompra: Number(nuevo.precioCompra),
            stockActual: Number(nuevo.stockActual),
            stockMaximo: Number(nuevo.stockMaximo),
            esParaElaborar: nuevo.esParaElaborar,
            unidadMedida: nuevo.unidadMedida,
            categoria: {
                denominacion: nuevo.categoria.denominacion,
                categoriaPadreId: nuevo.categoria.categoriaPadre?.id || null
                }
        }
        console.log(insumoNew)
        try {
            
        const res = await fetch("http://localhost:8080/articulo-insumo/crear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(insumoNew),
        });
        if (!res.ok) throw new Error("Error al agregar insumo");
        const data: ArticuloInsumo = await res.json();
        const categoria = new Categoria(
            data.categoria.denominacion,
            data.categoria.categoriaPadre,
            data.categoria.id
        );
        const nuevoInsumo = new ArticuloInsumo(
            data.denominacion,
            data.precioVenta,
            data.precioCompra,
            data.stockActual,
            data.stockMaximo,
            data.esParaElaborar,
            data.unidadMedida,
            categoria,
            data.id
        );
        setInsumos((prev) => [...prev, nuevoInsumo]);
        } catch (error) {
        console.error("Error al agregar insumo:", error);
        }
    };

    const editarInsumo = async (id: number, actualizado: ArticuloInsumo) => {
        try {
        const res = await fetch(`http://localhost:8080/articulo-insumo/actualizar/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actualizado),
        });
        if (!res.ok) throw new Error("Error al actualizar insumo");
        await res.json();
        setInsumos((prev) =>
            prev.map((item) => (item.id === id ? { ...actualizado, id } : item))
        );
        } catch (error) {
        console.error("Error al actualizar insumo:", error);
        }
    };

    const eliminarInsumo = async (id: number) => {
        try {
        const res = await fetch(`http://localhost:8080/articulo-insumo/eliminar/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Error al eliminar insumo");
        setInsumos((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
        console.error("Error al eliminar insumo:", error);
        }
    };

    useEffect(() => {
        fetchInsumos();
        fetchUnidadesMedida();
    }, []);

    return {
        insumos,
        unidadesMedida,
        fetchInsumos,
        fetchUnidadesMedida,
        agregarInsumo,
        editarInsumo,
        eliminarInsumo,
    };
}
