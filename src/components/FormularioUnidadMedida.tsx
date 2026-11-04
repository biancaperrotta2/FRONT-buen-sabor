import React, { useState, useEffect } from 'react'
import { UnidadMedida } from '../classes/UnidadMedidaClass'
import { apiFetchJson } from '../api/client'

interface Props {
    onClose: () => void
    onGuardar: (unidad: UnidadMedida) => void
    modoEdicion?: boolean
    unidadEnEdicion?: UnidadMedida | null
}

export const FormularioUnidadMedida = ({
    onClose,
    onGuardar,
    modoEdicion = false,
    unidadEnEdicion = null,
}: Props) => {
    const [denominacion, setDenominacion] = useState('')
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (modoEdicion && unidadEnEdicion) {
            setDenominacion(unidadEnEdicion.denominacion || '')
        } else {
            setDenominacion('') // Limpia al abrir en modo creación
        }
    }, [modoEdicion, unidadEnEdicion])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!denominacion.trim()) {
            alert('La denominación es obligatoria.')
            return
        }

        setGuardando(true)
        try {
            const body = JSON.stringify({ denominacion: denominacion.trim(), abreviatura: denominacion.trim().slice(0, 3).toLowerCase() })
            const data =
                modoEdicion && unidadEnEdicion?.id !== undefined
                    ? await apiFetchJson<any>(`/unidad-medida/${unidadEnEdicion.id}`, { method: 'PUT', body })
                    : await apiFetchJson<any>('/unidad-medida', { method: 'POST', body })

            onGuardar(new UnidadMedida(data.denominacion, data.id))
            onClose()
        } catch (error) {
            console.error('Error al guardar unidad de medida:', error)
            alert('No se pudo guardar la unidad de medida.')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                    Denominación
                </label>
                <input
                    type="text"
                    required
                    className="focus:outline-none focus:ring-1 focus:ring-green-400 border border-gray-200 py-2 px-2 w-full rounded-md shadow-sm"
                    placeholder="Ej: Litros"
                    value={denominacion}
                    onChange={(e) => setDenominacion(e.target.value)}
                    autoFocus
                />
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
                    disabled={guardando}
                    className="cursor-pointer bg-green-400 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-60"
                >
                    {guardando ? 'Guardando...' : modoEdicion ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    )
}
