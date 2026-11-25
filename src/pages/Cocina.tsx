import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { GiForkKnifeSpoon } from "react-icons/gi";
import { useAuth } from "../context/AuthContext";
import DialogoOrden from "../components/DialogoOrden";
import TablaPedidos from "../components/TablaPedidos";
import SnackBar from "../components/SnackBar";
import { Paginador } from "../components/Paginador";
import { useTablaServidor } from "../hooks/useTablaServidor";
import { listarCocinaTabla } from "../services/ordenesService";

const INTERVALO_ACTUALIZACION_MS = 15000;

// Página Cocina (enunciado, historia #7, figura 36): tabla de los pedidos en proceso y demorados,
// con búsqueda, paginado y orden por columna; el diálogo de cada uno permite pasarlo a Demorado
// o Listo y muestra sus productos.
export const Cocina = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const tabla = useTablaServidor(listarCocinaTabla);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const intervalo = setInterval(tabla.recargar, INTERVALO_ACTUALIZACION_MS);
    return () => clearInterval(intervalo);
  }, [tabla.recargar]);

  const cerrarMensaje = useCallback(() => setMensaje(null), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-amber-700 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">EL BUEN SABOR — Cocina</h1>
          {usuario && <p className="text-sm text-amber-100">Hola, {usuario.nombre}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/semielaborados")}
            className="text-sm bg-white text-amber-700 font-semibold rounded-md px-3 py-1 hover:bg-amber-100 transition"
          >
            Semielaborados
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/loginemail");
            }}
            className="text-sm border border-white rounded-md px-3 py-1 hover:bg-white hover:text-amber-700 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
            <h2 className="flex items-center gap-2 text-xl text-gray-700">
              <GiForkKnifeSpoon aria-hidden="true" /> Cocina
            </h2>
            <div className="flex items-center border border-gray-300 rounded-full px-3 focus-within:border-amber-700">
              <input
                type="search"
                value={tabla.busqueda}
                onChange={(e) => tabla.setBusqueda(e.target.value)}
                placeholder="Buscar orden..."
                aria-label="Buscar por número de orden o cliente"
                className="py-2 text-sm outline-none bg-transparent"
              />
              <FiSearch className="text-gray-500" aria-hidden="true" />
            </div>
          </div>

          {tabla.error && <p className="text-sm text-red-600 px-6 py-3">{tabla.error}</p>}
          {tabla.cargando && !tabla.datos ? (
            <p className="text-sm text-gray-500 px-6 py-6">Cargando...</p>
          ) : tabla.datos && tabla.datos.contenido.length === 0 ? (
            <p className="text-sm text-gray-500 px-6 py-6">
              {tabla.busqueda ? "No hay pedidos que coincidan con la búsqueda." : "No hay pedidos en cocina por ahora."}
            </p>
          ) : (
            tabla.datos && (
              <TablaPedidos
                filas={tabla.datos.contenido}
                modo="cocina"
                ordenarPor={tabla.ordenarPor}
                direccion={tabla.direccion}
                alClickearColumna={tabla.alClickearColumna}
                onVer={setAbierta}
              />
            )
          )}
          {tabla.datos && (
            <div className="px-6 py-3 border-t border-gray-200">
              <Paginador
                pagina={tabla.datos.pagina}
                totalPaginas={tabla.datos.totalPaginas}
                totalElementos={tabla.datos.totalElementos}
                tamanio={tabla.datos.tamanio}
                onCambiarPagina={tabla.setPagina}
              />
            </div>
          )}
        </section>
      </div>

      {abierta !== null && (
        <DialogoOrden
          idPedido={abierta}
          modo="cocina"
          onClose={() => setAbierta(null)}
          onActualizado={(m) => {
            setMensaje(m);
            tabla.recargar();
            // Al pasar a Listo sale de cocina: se cierra el diálogo.
            setAbierta(null);
          }}
        />
      )}

      <SnackBar mensaje={mensaje} onCerrar={cerrarMensaje} />
    </div>
  );
};

export default Cocina;
