import React, { createContext, useContext } from "react";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import type { UnidadMedida } from "../classes/UnidadMedidaClass";
import { useInsumosApi } from "../hooks/useInsumosApi"; // Asegúrate de que el path sea correcto
import type { Direccion, PageResponse } from "../services/paginacion";
import type { InsumoDto } from "../pages/Insumo";

interface InsumosContextType {
    insumos: ArticuloInsumo[];
    datosPagina: PageResponse<ArticuloInsumo> | null;
    busqueda: string;
    setBusqueda: (busqueda: string) => void;
    pagina: number;
    setPagina: (pagina: number) => void;
    ordenarPor: string | null;
    direccion: Direccion;
    alClickearColumna: (campo: string) => void;
    cargandoInsumos: boolean;
    errorInsumos: string | null;
    unidadesMedida: UnidadMedida[];
    fetchInsumos: () => void;
    agregarInsumo: (nuevo: InsumoDto) => Promise<void>;
    editarInsumo: (id: number, actualizado: InsumoDto) => Promise<void>;
    eliminarInsumo: (id: number) => Promise<void>;
}

const InsumosContext = createContext<InsumosContextType | undefined>(undefined);

export const useInsumos = (): InsumosContextType => {
    const context = useContext(InsumosContext);
    if (!context) {
        throw new Error("useInsumos debe usarse dentro de un InsumosProvider");
    }
    return context;
};

export const InsumosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const valor = useInsumosApi();

    return (
        <InsumosContext.Provider value={valor}>
            {children}
        </InsumosContext.Provider>
    );
};
