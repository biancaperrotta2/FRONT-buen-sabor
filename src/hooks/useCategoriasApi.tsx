import { useState, useEffect } from 'react';
import { Categoria } from '../classes/CategoriaClass';
import type { CategoriaDto } from '../pages/Categorias';
import { apiFetchJson } from '../api/client';

export function useCategoriasApi() {
    const [categorias, setCategorias] = useState<Categoria[]>([]);

    const cargarCategorias = async () => {
        try {
        const data = await apiFetchJson<any[]>('/categoria/all');
        const categoriasFormateadas = data.map((c: any) =>
            new Categoria(c.denominacion, c.categoriaPadre, c.id, c.tipo)
        );
        setCategorias(categoriasFormateadas);
        } catch (error) {
        console.error('Error al cargar categorías:', error);
        }
    };

    const cargarSubcategorias = async (padreId: number) => {
        try {
            const data = await apiFetchJson<any[]>(`/categoria/hijas/${padreId}`);
            return data.map((c: any) => new Categoria(c.denominacion, c.categoriaPadre, c.id, c.tipo));
        } catch (error) {
            console.error('Error al cargar subcategorías:', error);
            return [];
        }
    };

    const agregarCategoria = async (nueva: CategoriaDto) => {
        const categoriaGuardada = await apiFetchJson<any>('/categoria/crear', {
            method: 'POST',
            body: JSON.stringify({
                denominacion: nueva.denominacion,
                idCategoriaPadre: nueva.categoriaPadreId,
                tipo: nueva.tipo,
            }),
        });
        const nuevaInstancia = new Categoria(
            categoriaGuardada.denominacion ?? categoriaGuardada.nombre,
            categoriaGuardada.categoriaPadre,
            categoriaGuardada.id,
            categoriaGuardada.tipo
        );
        setCategorias(prev => [...prev, nuevaInstancia]);
    };

    const eliminarCategoria = async (id: number) => {
        await apiFetchJson(`/categoria/${id}`, { method: 'DELETE' });
        setCategorias(prev => prev.filter(cat => cat.id !== id));
    };

    const editarCategoria = async (id: number, datosActualizados: CategoriaDto) => {
        const actualizada = await apiFetchJson<any>(`/categoria/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                denominacion: datosActualizados.denominacion,
                idCategoriaPadre: datosActualizados.categoriaPadreId,
                tipo: datosActualizados.tipo,
            }),
        });
        const categoriaActualizada = new Categoria(
            actualizada.denominacion ?? actualizada.nombre,
            actualizada.categoriaPadre,
            actualizada.id,
            actualizada.tipo
        );
        setCategorias(prev =>
            prev.map(cat => (cat.id === id ? categoriaActualizada : cat))
        );
    };

    useEffect(() => {
        cargarCategorias();
    }, []);

    return {
        categorias,
        cargarCategorias,
        agregarCategoria,
        eliminarCategoria,
        editarCategoria,
        cargarSubcategorias
    };
}
