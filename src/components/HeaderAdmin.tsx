import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const HeaderAdmin = () => {
    const navigate = useNavigate()
    const { usuario, logout } = useAuth()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <div className='w-full h-20 bg-black flex justify-between items-center px-6'>
            <span
                onClick={() => navigate(usuario?.rol === 'COCINERO' ? '/cocina' : '/admin')}
                className='text-white font-bold text-lg cursor-pointer'
            >
                EL BUEN SABOR
            </span>
            <div className='flex items-center gap-4'>
                {usuario && (
                    <span className='text-white text-sm'>{usuario.nombre}</span>
                )}
                <span className='px-3 py-1 rounded bg-white/10 text-white text-xs font-bold tracking-wide'>
                    {usuario?.rol ?? 'ADMIN'}
                </span>
                <button
                    onClick={handleLogout}
                    className='cursor-pointer text-sm text-white border border-white/40 rounded px-3 py-1 hover:bg-white hover:text-black transition'
                >
                    Cerrar sesión
                </button>
            </div>
        </div>
    )
}

export default HeaderAdmin
