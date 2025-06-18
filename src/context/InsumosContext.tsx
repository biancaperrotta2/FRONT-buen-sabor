import React, { createContext, useContext } from "react";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import type { UnidadMedida } from "../classes/UnidadMedidaClass";
import { useInsumosApi } from "../hooks/useInsumosApi"; // Asegúrate de que el path sea correcto

interface InsumosContextType {
    insumos: ArticuloInsumo[];
    unidadesMedida: UnidadMedida[];
    fetchInsumos: () => void;
    agregarInsumo: (nuevo: ArticuloInsumo) => Promise<void>;
    editarInsumo: (id: number, actualizado: ArticuloInsumo) => Promise<void>;
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
    const {
        insumos,
        unidadesMedida,
        fetchInsumos,
        agregarInsumo,
        editarInsumo,
        eliminarInsumo,
    } = useInsumosApi();

    return (
        <InsumosContext.Provider
            value={{
                insumos,
                unidadesMedida,
                fetchInsumos,
                agregarInsumo,
                editarInsumo,
                eliminarInsumo,
            }}
        >
            {children}
        </InsumosContext.Provider>
    );
};
