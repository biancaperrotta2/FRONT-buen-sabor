import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ESTILO_LINK = 'hover:text-yellow-300 text-lg hover:bg-yellow-900 px-2 py-1 rounded';

// El cocinero también usa el panel (Semielaborados), pero solo ve lo suyo: el resto de las
// secciones son de administración y el backend se las rechazaría.
const SECCIONES_ADMIN = [
    { ruta: '/categorias', texto: 'Categorías' },
    { ruta: '/insumos', texto: 'Insumos' },
    { ruta: '/semielaborados', texto: 'Semielaborados' },
    { ruta: '/manufacturados', texto: 'Productos' },
    { ruta: '/promociones', texto: 'Promociones' },
    { ruta: '/empleados', texto: 'Empleados' },
    { ruta: '/clientes', texto: 'Clientes' },
    { ruta: '/reportes', texto: 'Reportes' },
    { ruta: '/facturas', texto: 'Facturas' },
];

const SECCIONES_COCINERO = [
    { ruta: '/cocina', texto: 'Cocina' },
    { ruta: '/semielaborados', texto: 'Semielaborados' },
];

export const SideBar: React.FC = () => {
    const { usuario } = useAuth();
    const secciones = usuario?.rol === 'COCINERO' ? SECCIONES_COCINERO : SECCIONES_ADMIN;
    return (
        <div className='h-screen flex flex-col justify-start bg-black w-60 text-white p-4'>
            <div className='pb-6 text-start'>
                <h2 className='text-lg px-2 font-bold border-b border-gray-700 pb-2'>Secciones</h2>
            </div>
            <nav className='flex flex-col space-y-4'>
                {secciones.map((s) => (
                    <Link key={s.ruta} to={s.ruta} className={ESTILO_LINK}>
                        {s.texto}
                    </Link>
                ))}
            </nav>
        </div>
    );
};

export default SideBar
