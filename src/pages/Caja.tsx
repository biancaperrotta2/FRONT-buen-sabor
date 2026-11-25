import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiSearch } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { Modal } from "../components/Modal";
import DialogoOrden, { ETIQUETA_ESTADO } from "../components/DialogoOrden";
import TablaPedidos from "../components/TablaPedidos";
import SnackBar from "../components/SnackBar";
import { Paginador } from "../components/Paginador";
import { useTablaServidor } from "../hooks/useTablaServidor";
import { listarOrdenes } from "../services/ordenesService";
import {
  marcarReintegrado,
  reintegrosPendientes,
  type EstadoPedidoApi,
  type PedidoCaja,
} from "../services/pedidoService";
import { nombrePasarela } from "../utils/formaPago";

const INTERVALO_ACTUALIZACION_MS = 15000;

const ESTADOS: EstadoPedidoApi[] = ["PENDIENTE", "EN_PROCESO", "DEMORADO", "PREPARADO", "EN_CAMINO", "ENTREGADO", "CANCELADO"];

// Página Órdenes del cajero (enunciado, historia #3, figura 32): todas las órdenes en una tabla
// con filtro por estado, búsqueda, paginado y orden por columna; el diálogo de cada orden tiene
// el cambio de estado y las acciones de cobro.
export const Caja = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [estado, setEstado] = useState<EstadoPedidoApi | "">("");
  // El hook guarda la función de carga de la primera vez; el filtro se lee de una ref para que
  // siempre use el estado elegido.
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const tabla = useTablaServidor((params) => listarOrdenes(params, estadoRef.current));

  const [abierta, setAbierta] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [paraDevolver, setParaDevolver] = useState<PedidoCaja[]>([]);
  const [aMarcarDevuelto, setAMarcarDevuelto] = useState<PedidoCaja | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarDevoluciones = useCallback(() => {
    reintegrosPendientes().then(setParaDevolver).catch(() => setParaDevolver([]));
  }, []);

  useEffect(() => {
    cargarDevoluciones();
    const intervalo = setInterval(() => {
      tabla.recargar();
      cargarDevoluciones();
    }, INTERVALO_ACTUALIZACION_MS);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabla.recargar, cargarDevoluciones]);

  const cambiarFiltro = (nuevo: EstadoPedidoApi | "") => {
    setEstado(nuevo);
    estadoRef.current = nuevo;
    tabla.setPagina(0);
    tabla.recargar();
  };

  const handleMarcarDevuelto = async (pedido: PedidoCaja) => {
    try {
      await marcarReintegrado(pedido.id);
      setAMarcarDevuelto(null);
      cargarDevoluciones();
      tabla.recargar();
      setMensaje("Se marcó el pago como devuelto");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos marcar el pago como devuelto.");
    }
  };

  const cerrarMensaje = useCallback(() => setMensaje(null), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-amber-700 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">EL BUEN SABOR — Caja</h1>
          {usuario && <p className="text-sm text-amber-100">Hola, {usuario.nombre}</p>}
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/loginemail");
          }}
          className="text-sm border border-white rounded-md px-3 py-1 hover:bg-white hover:text-amber-700 transition"
        >
          Cerrar sesión
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}

        {paraDevolver.length > 0 && (
          <section className="bg-amber-50 border border-amber-300 rounded-xl p-4">
            <h2 className="font-semibold mb-1">Pagos para devolver</h2>
            <p className="text-sm text-gray-600 mb-3">
              Órdenes canceladas que ya estaban pagadas online. Devolvé el pago desde Mercado Pago o desde la pasarela
              cripto (según cómo pagó) y después marcalo acá.
            </p>
            <ul className="space-y-2">
              {paraDevolver.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-md border border-amber-200 px-3 py-2 text-sm">
                  <span>
                    <span className="font-semibold">#{p.id}</span> · {p.cliente ? `${p.cliente.nombre} ${p.cliente.apellido}` : "—"} ·{" "}
                    ${p.total.toLocaleString("es-AR")}
                  </span>
                  <button
                    onClick={() => setAMarcarDevuelto(p)}
                    className="text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-md px-3 py-1"
                  >
                    Marcar como devuelto
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
            <h2 className="flex items-center gap-2 text-xl text-gray-700">
              <FiFileText aria-hidden="true" /> Órdenes
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="sr-only" htmlFor="filtro-estado">Filtrar por estado</label>
              <select
                id="filtro-estado"
                value={estado}
                onChange={(e) => cambiarFiltro(e.target.value as EstadoPedidoApi | "")}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="">Todos</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ETIQUETA_ESTADO[e]}
                  </option>
                ))}
              </select>
              <div className="flex items-center border border-gray-300 rounded-full px-3 focus-within:border-amber-700">
                <input
                  type="search"
                  value={tabla.busqueda}
                  onChange={(e) => tabla.setBusqueda(e.target.value)}
                  placeholder="Buscar..."
                  aria-label="Buscar por número de orden o cliente"
                  className="py-2 text-sm outline-none bg-transparent"
                />
                <FiSearch className="text-gray-500" aria-hidden="true" />
              </div>
            </div>
          </div>

          {tabla.error && <p className="text-sm text-red-600 px-6 py-3">{tabla.error}</p>}
          {tabla.cargando && !tabla.datos ? (
            <p className="text-sm text-gray-500 px-6 py-6">Cargando...</p>
          ) : tabla.datos && tabla.datos.contenido.length === 0 ? (
            <p className="text-sm text-gray-500 px-6 py-6">
              {estado || tabla.busqueda ? "No hay órdenes que coincidan con el filtro." : "Todavía no hay órdenes."}
            </p>
          ) : (
            tabla.datos && (
              <TablaPedidos
                filas={tabla.datos.contenido}
                modo="caja"
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
          modo="caja"
          onClose={() => setAbierta(null)}
          onActualizado={(m) => {
            setMensaje(m);
            tabla.recargar();
            cargarDevoluciones();
          }}
        />
      )}

      <Modal
        isOpen={aMarcarDevuelto !== null}
        onClose={() => setAMarcarDevuelto(null)}
        titulo={aMarcarDevuelto ? `Pago del pedido #${aMarcarDevuelto.id}` : ""}
      >
        {aMarcarDevuelto && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              ¿Ya devolviste los ${aMarcarDevuelto.total.toLocaleString("es-AR")} desde {nombrePasarela(aMarcarDevuelto.formaPago)}? El
              cliente va a ver que se le devolvió el pago.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setAMarcarDevuelto(null)}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleMarcarDevuelto(aMarcarDevuelto)}
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md"
              >
                Sí, ya lo devolví
              </button>
            </div>
          </div>
        )}
      </Modal>

      <SnackBar mensaje={mensaje} onCerrar={cerrarMensaje} />
    </div>
  );
};

export default Caja;
