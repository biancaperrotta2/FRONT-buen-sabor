import { useState, useEffect } from "react";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { UnidadMedida } from "../classes/UnidadMedidaClass";
import type { InsumoRecord } from "../components/FormularioInsumo";
import type { InsumoDto } from "../pages/Insumo";
import { apiFetchJson } from "../api/client";
import { useTablaServidor } from "./useTablaServidor";
import { construirQueryTabla, type PageResponse, type ParametrosTabla } from "../services/paginacion";

function instanciarInsumo(item: any): ArticuloInsumo {
    return new ArticuloInsumo(
        item.denominacion,
        item.precioVenta,
        item.unidadMedida,
        item.categoria,
        item.precioCompra,
        item.stockActual,
        item.stockMaximo,
        item.esParaElaborar,
        item.imagenUrl,
        item.activo,
        item.id,
        item.margen,
        item.stockMinimo
    );
}

async function fetchInsumosPagina(params: ParametrosTabla): Promise<PageResponse<ArticuloInsumo>> {
    const respuesta = await apiFetchJson<PageResponse<any>>(`/insumos/all?${construirQueryTabla(params)}`);
    return { ...respuesta, contenido: respuesta.contenido.map(instanciarInsumo) };
}

export function useInsumosApi() {
    const tabla = useTablaServidor<ArticuloInsumo>(fetchInsumosPagina);
    const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);

    const fetchUnidadesMedida = async () => {
        try {
        const data = await apiFetchJson<any[]>("/unidad-medida/all");
        const instancias = data.map((item: any) => new UnidadMedida(item.denominacion, item.id));
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
            margen: nuevo.margen,
            stockActual: Number(nuevo.stockActual),
            stockMinimo: Number(nuevo.stockMinimo ?? 0),
            stockMaximo: Number(nuevo.stockMaximo),
            esParaElaborar: nuevo.esParaElaborar,
            unidadMedida: nuevo.unidadMedida,
            imagenUrl: nuevo.imagenUrl ?? null,
            categoria: {
                denominacion: nuevo.categoria.denominacion,
                categoriaPadreId: nuevo.categoria.id ?? null,
            },
        };
        await apiFetchJson<any>("/insumos", {
            method: "POST",
            body: JSON.stringify(traducirParaBackend(insumoNew)),
        });
        tabla.recargar();
    };

    const editarInsumo = async (id: number, actualizado: InsumoDto) => {
        await apiFetchJson(`/insumos/${id}`, {
            method: "PUT",
            body: JSON.stringify(traducirParaBackend({
                denominacion: actualizado.denominacion,
                precioVenta: actualizado.precioVenta,
                precioCompra: actualizado.precioCompra,
                margen: actualizado.margen,
                stockActual: actualizado.stockActual,
                stockMinimo: actualizado.stockMinimo ?? 0,
                stockMaximo: actualizado.stockMaximo,
                esParaElaborar: actualizado.esParaElaborar,
                unidadMedida: actualizado.unidadMedida,
                imagenUrl: actualizado.imagenUrl ?? null,
                categoria: {
                    denominacion: actualizado.categoria.denominacion,
                    categoriaPadreId: actualizado.categoria.id ?? null,
                },
            })),
        });
        tabla.recargar();
    };

    const eliminarInsumo = async (id: number) => {
        await apiFetchJson(`/insumos/${id}`, { method: "DELETE" });
        tabla.recargar();
    };

    useEffect(() => {
        fetchUnidadesMedida();
    }, []);

    return {
        insumos: tabla.datos?.contenido ?? [],
        datosPagina: tabla.datos,
        busqueda: tabla.busqueda,
        setBusqueda: tabla.setBusqueda,
        pagina: tabla.pagina,
        setPagina: tabla.setPagina,
        ordenarPor: tabla.ordenarPor,
        direccion: tabla.direccion,
        alClickearColumna: tabla.alClickearColumna,
        cargandoInsumos: tabla.cargando,
        errorInsumos: tabla.error,
        unidadesMedida,
        fetchInsumos: tabla.recargar,
        fetchUnidadesMedida,
        agregarInsumo,
        editarInsumo,
        eliminarInsumo,
    };
}

// El backend espera "categoria.idCategoriaPadre", el front lo maneja como "categoriaPadreId"
function traducirParaBackend(insumo: InsumoRecord) {
    return {
        denominacion: insumo.denominacion,
        precioVenta: insumo.precioVenta,
        precioCompra: insumo.precioCompra,
        margen: insumo.margen,
        stockActual: insumo.stockActual,
        stockMinimo: insumo.stockMinimo,
        stockMaximo: insumo.stockMaximo,
        esParaElaborar: insumo.esParaElaborar,
        unidadMedida: insumo.unidadMedida,
        // Lista completa de fotos deseada: [] quita la que hubiera (ver ImagenesArticulo).
        imagenes: insumo.imagenUrl ? [{ denominacion: insumo.denominacion, url: insumo.imagenUrl }] : [],
        categoria: {
            denominacion: insumo.categoria.denominacion,
            idCategoriaPadre: insumo.categoria.categoriaPadreId,
        },
    };
}
