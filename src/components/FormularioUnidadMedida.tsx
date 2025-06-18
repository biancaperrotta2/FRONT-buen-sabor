import React, { useState, useEffect } from 'react'
import type { UnidadMedida } from '../classes/UnidadMedidaClass'

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

    useEffect(() => {
        if (modoEdicion && unidadEnEdicion) {
            setDenominacion(unidadEnEdicion.denominacion || '')
        } else {
            setDenominacion('') // Limpia al abrir en modo creación
        }
    }, [modoEdicion, unidadEnEdicion])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!denominacion.trim()) {
            alert('La denominación es obligatoria.')
            return
        }

        const unidad: UnidadMedida = {
            ...unidadEnEdicion,
            denominacion: denominacion.trim(),
        }

        onGuardar(unidad)
        onClose()
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
                    type="button"
                    onClick={handleSubmit}
                    className="cursor-pointer bg-green-400 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    {modoEdicion ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </form>
    )
}
