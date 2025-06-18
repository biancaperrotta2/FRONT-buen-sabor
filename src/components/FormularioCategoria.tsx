// src/components/FormularioCategorias.tsx
import React, { useState, useEffect } from 'react'
import type { Categoria } from '../classes/CategoriaClass'
import { useCategoria } from '../context/CategoriaContext'
import type { CategoriaDto } from '../pages/Categorias'

interface Props {
    onClose: () => void
    modoEdicion: boolean
    categoriaEnEdicion: Categoria | null
    }

    export const FormularioCategorias: React.FC<Props> = ({ onClose, modoEdicion, categoriaEnEdicion }) => {
        const { categorias, agregarCategoria, editarCategoria } = useCategoria()


        const [denominacion, setDenominacion] = useState('')
        const [categoriaPadreId, setCategoriaPadreId] = useState<number | null>(null)

        useEffect(() => {
            if (modoEdicion && categoriaEnEdicion) {
            setDenominacion(categoriaEnEdicion.denominacion)
            setCategoriaPadreId(categoriaEnEdicion.categoriaPadre?.id ?? null)
            } else {
            setDenominacion('')
            setCategoriaPadreId(null)
            }
        }, [modoEdicion, categoriaEnEdicion])

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault()
            if (!denominacion.trim()) return alert('El nombre de la categoría es obligatorio.')

            const categoriaDto: CategoriaDto = {
            denominacion: denominacion.trim(),
            categoriaPadreId: categoriaPadreId || null,
            }

            if (modoEdicion && categoriaEnEdicion?.id !== undefined) {
            editarCategoria(categoriaEnEdicion.id, categoriaDto)
            } else {
            agregarCategoria(categoriaDto)
            }

            onClose()
        }
        
        return (
            <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Nombre de la categoría</label>
                <input
                type="text"
                required
                className="focus:outline-none focus:ring-1 focus:ring-green-400 border border-gray-200 py-2 px-2 w-full rounded-md shadow-sm"
                placeholder="Ej: Bebidas"
                value={denominacion}
                onChange={(e) => setDenominacion(e.target.value)}
                autoFocus
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Categoría Padre</label>
                <select
                className="focus:outline-none focus:ring-1 focus:ring-green-400 border border-gray-200 py-2 px-2 w-full rounded-md shadow-sm"
                value={categoriaPadreId ?? ''}
                onChange={(e) => setCategoriaPadreId(e.target.value ? Number(e.target.value) : null)}
                >
                <option value="" disabled>Ninguna</option>

                {(!modoEdicion || categoriaEnEdicion?.categoriaPadre) &&
                    categorias
                    .filter((c) => c.id !== categoriaEnEdicion?.id)
                    .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                        {cat.denominacion}
                        </option>
                    ))}
                </select>

            </div>

            <div className="flex justify-end">
                <button
                type="button"
                className="cursor-pointer bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 mr-2"
                onClick={onClose}
                >
                Cancelar
                </button>
                <button
                type="submit"
                className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                {modoEdicion ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
            </form>
        )
}
