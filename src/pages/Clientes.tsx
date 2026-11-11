import { Fragment, useState } from "react";
import HeaderAdmin from "../components/HeaderAdmin";
import SideBar from "../components/SideBar";
import { Modal } from "../components/Modal";
import EncabezadoOrdenable from "../components/EncabezadoOrdenable";
import Paginador from "../components/Paginador";
import { mensajeDeError } from "../api/client";
import { useTablaServidor } from "../hooks/useTablaServidor";
import {
  desactivarCliente,
  reactivarCliente,
  listarClientes,
  type Cliente,
} from "../services/clienteService";
import type { EstadoPagoApi, EstadoPedidoApi } from "../services/pedidoService";

const ESTADO_LABEL: Record<EstadoPedidoApi, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En preparación",
  DEMORADO: "Demorado",
  PREPARADO: "Listo",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const ESTADO_COLOR: Record<EstadoPedidoApi, string> = {
  PENDIENTE: "bg-gray-200 text-gray-800",
  EN_PROCESO: "bg-blue-100 text-blue-800",
  DEMORADO: "bg-yellow-100 text-yellow-800",
  PREPARADO: "bg-purple-100 text-purple-800",
  EN_CAMINO: "bg-indigo-100 text-indigo-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const ESTADO_PAGO_LABEL: Record<EstadoPagoApi, string> = {
  PENDIENTE: "Pago pendiente",
  PAGADO: "Pagado",
  RECHAZADO: "Pago rechazado",
  REINTEGRADO: "Pago reintegrado",
};

const formatearFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

export const Clientes = () => {
  const {
    busqueda,
    setBusqueda,
    pagina,
    setPagina,
    ordenarPor,
    direccion,
    alClickearColumna,
    datos,
    cargando,
    error: errorCarga,
    recargar,
  } = useTablaServidor<Cliente>(listarClientes);

  const [error, setError] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [clienteADesactivar, setClienteADesactivar] = useState<Cliente | null>(null);

  const [clienteAReactivar, setClienteAReactivar] = useState<Cliente | null>(null);

  const confirmarDesactivar = async () => {
    if (!clienteADesactivar) return;
    setError(null);
    try {
      await desactivarCliente(clienteADesactivar.id);
      recargar();
    } catch (e) {
      setError(`No se pudo desactivar al cliente: ${mensajeDeError(e)}`);
    } finally {
      setClienteADesactivar(null);
    }
  };

  const confirmarReactivar = async () => {
    if (!clienteAReactivar) return;
    setError(null);
    try {
      await reactivarCliente(clienteAReactivar.id);
      recargar();
    } catch (e) {
      setError(`No se pudo reactivar al cliente: ${mensajeDeError(e)}`);
    } finally {
      setClienteAReactivar(null);
    }
  };

  const clientes = datos?.contenido ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAdmin />

      <div className="flex flex-1 overflow-auto">
        <SideBar />

        <main className="flex-1 py-10 px-10 pb-10 bg-gray-100">
          <h1 className="text-2xl font-semibold pb-4">Clientes</h1>

          <input
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full max-w-sm mb-4 border rounded-md px-3 py-2 text-sm"
          />

          {(error || errorCarga) && (
            <p className="text-red-600 text-sm mb-4">{error ?? errorCarga}</p>
          )}

          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full text-sm text-center">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <EncabezadoOrdenable campo="nombre" etiqueta="Nombre" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <EncabezadoOrdenable campo="email" etiqueta="Email" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-6 py-3">Teléfono</th>
                  <th className="px-6 py-3">Pedidos</th>
                  <EncabezadoOrdenable campo="activo" etiqueta="Estado" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {cargando && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                )}
                {!cargando && clientes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-gray-500">
                      No hay clientes que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
                {clientes.map((cliente) => (
                  <Fragment key={cliente.id}>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">
                        {cliente.nombre} {cliente.apellido}
                      </td>
                      <td className="px-6 py-4">{cliente.email}</td>
                      <td className="px-6 py-4">{cliente.telefono}</td>
                      <td className="px-6 py-4">{cliente.pedidos.length}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            cliente.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {cliente.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            className="cursor-pointer rounded-md px-4 py-2 text-white bg-blue-500 hover:bg-blue-300"
                            onClick={() =>
                              setExpandido((prev) => (prev === cliente.id ? null : cliente.id))
                            }
                          >
                            {expandido === cliente.id ? "Ocultar pedidos" : "Ver pedidos"}
                          </button>
                          {cliente.activo ? (
                            <button
                              className="cursor-pointer rounded-md px-4 py-2 text-white bg-red-500 hover:bg-red-300"
                              onClick={() => setClienteADesactivar(cliente)}
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button
                              className="cursor-pointer rounded-md px-4 py-2 text-white bg-green-600 hover:bg-green-500"
                              onClick={() => setClienteAReactivar(cliente)}
                            >
                              Reactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandido === cliente.id && (
                      <tr className="border-b bg-gray-50">
                        <td colSpan={6} className="px-6 py-4 text-left">
                          {cliente.pedidos.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                              Este cliente todavía no hizo ningún pedido.
                            </p>
                          ) : (
                            <table className="w-full border border-gray-200 bg-white">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="text-left p-2">Pedido</th>
                                  <th className="text-left p-2">Fecha</th>
                                  <th className="text-left p-2">Estado</th>
                                  <th className="text-left p-2">Pago</th>
                                  <th className="text-right p-2">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cliente.pedidos.map((pedido) => (
                                  <tr key={pedido.id} className="border-t">
                                    <td className="p-2">#{pedido.id}</td>
                                    <td className="p-2">{formatearFecha(pedido.fechaPedido)}</td>
                                    <td className="p-2">
                                      <span
                                        className={`text-xs font-semibold px-2 py-1 rounded-full ${ESTADO_COLOR[pedido.estadoPedido]}`}
                                      >
                                        {ESTADO_LABEL[pedido.estadoPedido]}
                                      </span>
                                    </td>
                                    <td className="p-2">{ESTADO_PAGO_LABEL[pedido.estadoPago]}</td>
                                    <td className="p-2 text-right">
                                      ${pedido.total.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>

            {datos && (
              <Paginador
                pagina={pagina}
                totalPaginas={datos.totalPaginas}
                totalElementos={datos.totalElementos}
                tamanio={datos.tamanio}
                onCambiarPagina={setPagina}
              />
            )}
          </div>
        </main>
      </div>

      <Modal
        isOpen={clienteADesactivar !== null}
        onClose={() => setClienteADesactivar(null)}
        titulo="Confirmar desactivación"
      >
        <div className="text-center">
          <p className="mb-4">
            ¿Desactivar a{" "}
            <strong>
              {clienteADesactivar?.nombre} {clienteADesactivar?.apellido}
            </strong>
            ? Va a dejar de poder iniciar sesión.
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              onClick={() => setClienteADesactivar(null)}
            >
              Cancelar
            </button>
            <button
              className="cursor-pointer bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              onClick={confirmarDesactivar}
            >
              Desactivar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={clienteAReactivar !== null}
        onClose={() => setClienteAReactivar(null)}
        titulo="Confirmar reactivación"
      >
        <div className="text-center">
          <p className="mb-4">
            ¿Reactivar a{" "}
            <strong>
              {clienteAReactivar?.nombre} {clienteAReactivar?.apellido}
            </strong>
            ? Va a poder volver a iniciar sesión.
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              onClick={() => setClienteAReactivar(null)}
            >
              Cancelar
            </button>
            <button
              className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={confirmarReactivar}
            >
              Reactivar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Clientes;
