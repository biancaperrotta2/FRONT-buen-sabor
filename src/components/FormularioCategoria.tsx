// src/components/FormularioCategorias.tsx
import React, { useState, useEffect } from 'react'
import type { Categoria, TipoCategoria } from '../classes/CategoriaClass'
import { useCategoria } from '../context/CategoriaContext'
import type { CategoriaDto } from '../pages/Categorias'
import { mensajeDeError } from '../api/client'

interface Props {
    onClose: () => void
    modoEdicion: boolean
    categoriaEnEdicion: Categoria | null
    }

    export const FormularioCategorias: React.FC<Props> = ({ onClose, modoEdicion, categoriaEnEdicion }) => {
        const { categorias, agregarCategoria, editarCategoria } = useCategoria()


        const [denominacion, setDenominacion] = useState('')
        const [categoriaPadreId, setCategoriaPadreId] = useState<number | null>(null)
        const [tipo, setTipo] = useState<TipoCategoria>('PRODUCTO')
        const [error, setError] = useState<string | null>(null)

        // Una subcategoría siempre es del mismo tipo que su padre (lo fuerza el backend).
        const padre = categorias.find((c) => c.id === categoriaPadreId) ?? null
        const tipoEfectivo: TipoCategoria = padre ? padre.tipo : tipo

        useEffect(() => {
            if (modoEdicion && categoriaEnEdicion) {
            setDenominacion(categoriaEnEdicion.denominacion)
            setCategoriaPadreId(categoriaEnEdicion.categoriaPadre?.id ?? null)
            setTipo(categoriaEnEdicion.tipo)
            } else {
            setDenominacion('')
            setCategoriaPadreId(null)
            setTipo('PRODUCTO')
            }
        }, [modoEdicion, categoriaEnEdicion])

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault()
            if (!denominacion.trim()) return alert('El nombre de la categoría es obligatorio.')

            const categoriaDto: CategoriaDto = {
            denominacion: denominacion.trim(),
            categoriaPadreId: categoriaPadreId || null,
            tipo: tipoEfectivo,
            }

            setError(null)
            try {
            if (modoEdicion && categoriaEnEdicion?.id !== undefined) {
                await editarCategoria(categoriaEnEdicion.id, categoriaDto)
            } else {
                await agregarCategoria(categoriaDto)
            }
            onClose()
            } catch (err) {
            setError(mensajeDeError(err))
            }
        }

        return (
            <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
                <p role="alert" className="rounded-md bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2">
                No se pudo guardar la categoría: {error}
                </p>
            )}
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
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <select
                className="focus:outline-none focus:ring-1 focus:ring-green-400 border border-gray-200 py-2 px-2 w-full rounded-md shadow-sm disabled:bg-gray-100"
                value={tipoEfectivo}
                onChange={(e) => setTipo(e.target.value as TipoCategoria)}
                disabled={padre !== null}
                >
                <option value="PRODUCTO">Productos (se muestra en el menú)</option>
                <option value="INSUMO">Insumos (materia prima)</option>
                </select>
                <span className="text-xs text-gray-500">
                {padre
                    ? `Hereda el tipo de "${padre.denominacion}".`
                    : 'Las de Productos aparecen en el formulario de Productos y Promociones; las de Insumos, en el de Insumos.'}
                </span>
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
                        {cat.denominacion} ({cat.tipo === 'INSUMO' ? 'Insumos' : 'Productos'})
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
