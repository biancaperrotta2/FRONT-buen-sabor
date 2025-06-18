import { useState, useEffect } from 'react';
import { Categoria } from '../classes/CategoriaClass';
import type { CategoriaDto } from '../pages/Categorias';

export function useCategoriasApi() {
    const [categorias, setCategorias] = useState<Categoria[]>([]);

    const cargarCategorias = async () => {
        try {
        const res = await fetch('http://localhost:8080/categoria/all');
        if (!res.ok) throw new Error('Error al cargar categorías');
        const data = await res.json();
        const categoriasFormateadas = data.map((c: any) =>
            new Categoria(c.denominacion, c.categoriaPadre, c.id)
        );
        setCategorias(categoriasFormateadas);
        } catch (error) {
        console.error('Error al cargar categorías:', error);
        }
    };

    const cargarSubcategorias = async (padreId: number) => {
        try {
            const res = await fetch(`http://localhost:8080/categoria/hijas/${padreId}`);
            if (!res.ok) throw new Error('Error al cargar subcategorías');
            const data = await res.json();
            const subcategoriasFormateadas = data.map((c: any) =>
            new Categoria(c.denominacion, c.categoriaPadre, c.id)
            );
            return subcategoriasFormateadas;
        } catch (error) {
            console.error('Error al cargar subcategorías:', error);
            return [];
        }
    };

    const agregarCategoria = async (nueva: CategoriaDto) => {
        try {
        const res = await fetch('http://localhost:8080/categoria/crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nueva),
        });
        if (!res.ok) throw new Error('Error al guardar categoría');
        const categoriaGuardada = await res.json();
        const nuevaInstancia = new Categoria(
            categoriaGuardada.denominacion,
            categoriaGuardada.categoriaPadre,
            categoriaGuardada.id
        );
        setCategorias(prev => [...prev, nuevaInstancia]);
        } catch (error) {
        console.error('Error al agregar categoría:', error);
        }
    };

    const eliminarCategoria = async (id: number) => {
        try {
        const res = await fetch(`http://localhost:8080/categoria/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Error al eliminar categoría');
        setCategorias(prev => prev.filter(cat => cat.id !== id));
        } catch (error) {
        console.error('Error al eliminar categoría:', error);
        }
    };

    const editarCategoria = async (id: number, datosActualizados: CategoriaDto) => {
        try {
        const res = await fetch(`http://localhost:8080/categoria/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados),
        });
        if (!res.ok) throw new Error('Error al editar categoría');
        const actualizada = await res.json();
        const categoriaActualizada = new Categoria(
            actualizada.denominacion,
            actualizada.categoriaPadre,
            actualizada.id
        );
        setCategorias(prev =>
            prev.map(cat => (cat.id === id ? categoriaActualizada : cat))
        );
        } catch (error) {
        console.error('Error al editar categoría:', error);
        }
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
