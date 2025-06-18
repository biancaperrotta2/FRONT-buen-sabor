import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useCategoriasApi } from '../hooks/useCategoriasApi';
import type { CategoriaDto } from '../pages/Categorias';
import { Categoria } from '../classes/CategoriaClass';

type CategoriaContextType = {
    categorias: Categoria[];
    agregarCategoria: (nueva: CategoriaDto) => void;
    cargarCategorias: () => void;
    eliminarCategoria: (id: number) => void;
    editarCategoria: (id: number, datosActualizados: CategoriaDto) => void;
    cargarSubcategorias: (padreId: number ) => Promise<Categoria[]>
    };

    const CategoriaContext = createContext<CategoriaContextType | undefined>(undefined);

    export const useCategoria = (): CategoriaContextType => {
    const context = useContext(CategoriaContext);
    if (!context) {
        throw new Error('useCategoria debe usarse dentro de un CategoriaProvider');
    }
    return context;
    };

    type CategoriaProviderProps = {
    children: ReactNode;
    };

    export const CategoriaProvider = ({ children }: CategoriaProviderProps) => {
    const {
        categorias,
        cargarCategorias,
        agregarCategoria,
        eliminarCategoria,
        editarCategoria,
        cargarSubcategorias
    } = useCategoriasApi();

    return (
        <CategoriaContext.Provider
        value={{
            categorias,
            agregarCategoria,
            cargarCategorias,
            eliminarCategoria,
            editarCategoria,
            cargarSubcategorias
        }}
        >
        {children}
        </CategoriaContext.Provider>
    );
};
