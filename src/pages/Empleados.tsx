import { useState } from "react";
import HeaderAdmin from "../components/HeaderAdmin";
import SideBar from "../components/SideBar";
import { Boton } from "../components/Boton";
import { Modal } from "../components/Modal";
import { FormularioEmpleado } from "../components/FormularioEmpleado";
import EncabezadoOrdenable from "../components/EncabezadoOrdenable";
import Paginador from "../components/Paginador";
import { mensajeDeError } from "../api/client";
import { useTablaServidor } from "../hooks/useTablaServidor";
import {
  desactivarEmpleado,
  reactivarEmpleado,
  listarEmpleados,
  type Empleado,
} from "../services/empleadoService";

const CARGO_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  EMPLEADO: "Empleado",
  CAJERO: "Cajero",
  REPARTIDOR: "Repartidor",
  COCINERO: "Cocinero",
  CLIENTE: "Cliente",
};

export const Empleados = () => {
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
  } = useTablaServidor<Empleado>(listarEmpleados);

  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [empleadoADesactivar, setEmpleadoADesactivar] = useState<Empleado | null>(null);

  const [empleadoAReactivar, setEmpleadoAReactivar] = useState<Empleado | null>(null);

  const confirmarDesactivar = async () => {
    if (!empleadoADesactivar) return;
    setError(null);
    try {
      await desactivarEmpleado(empleadoADesactivar.id);
      recargar();
    } catch (e) {
      setError(`No se pudo desactivar al empleado: ${mensajeDeError(e)}`);
    } finally {
      setEmpleadoADesactivar(null);
    }
  };

  const confirmarReactivar = async () => {
    if (!empleadoAReactivar) return;
    setError(null);
    try {
      await reactivarEmpleado(empleadoAReactivar.id);
      recargar();
    } catch (e) {
      setError(`No se pudo reactivar al empleado: ${mensajeDeError(e)}`);
    } finally {
      setEmpleadoAReactivar(null);
    }
  };

  const empleados = datos?.contenido ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAdmin />

      <div className="flex flex-1 overflow-auto">
        <SideBar />

        <main className="flex-1 py-10 px-10 pb-10 bg-gray-100">
          <div className="flex justify-between items-center pb-4">
            <h1 className="text-2xl font-semibold">Empleados</h1>
            <Boton
              estiloBoton="border rounded-md py-2 px-8 font-semibold text-sm bg-[#d6aa7b] text-white hover:bg-[#c69a69] transition"
              textoBoton="Añadir"
              onClick={() => setIsModalOpen(true)}
            />
          </div>

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
                  <EncabezadoOrdenable campo="rol" etiqueta="Rol" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
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
                {!cargando && empleados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-gray-500">
                      No hay empleados que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
                {empleados.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">
                      {emp.nombre} {emp.apellido}
                    </td>
                    <td className="px-6 py-4">{emp.email}</td>
                    <td className="px-6 py-4">{emp.telefono}</td>
                    <td className="px-6 py-4">{CARGO_LABEL[emp.cargo] ?? emp.cargo}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          emp.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {emp.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.activo ? (
                        <button
                          className="cursor-pointer rounded-md px-6 py-2 text-white bg-red-500 hover:bg-red-300"
                          onClick={() => setEmpleadoADesactivar(emp)}
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          className="cursor-pointer rounded-md px-6 py-2 text-white bg-green-600 hover:bg-green-500"
                          onClick={() => setEmpleadoAReactivar(emp)}
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        titulo="Nuevo empleado"
      >
        <FormularioEmpleado onClose={() => setIsModalOpen(false)} onCreado={recargar} />
      </Modal>

      <Modal
        isOpen={empleadoADesactivar !== null}
        onClose={() => setEmpleadoADesactivar(null)}
        titulo="Confirmar desactivación"
      >
        <div className="text-center">
          <p className="mb-4">
            ¿Desactivar a{" "}
            <strong>
              {empleadoADesactivar?.nombre} {empleadoADesactivar?.apellido}
            </strong>
            ? Va a dejar de poder iniciar sesión.
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              onClick={() => setEmpleadoADesactivar(null)}
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
        isOpen={empleadoAReactivar !== null}
        onClose={() => setEmpleadoAReactivar(null)}
        titulo="Confirmar reactivación"
      >
        <div className="text-center">
          <p className="mb-4">
            ¿Reactivar a{" "}
            <strong>
              {empleadoAReactivar?.nombre} {empleadoAReactivar?.apellido}
            </strong>
            ? Va a poder volver a iniciar sesión.
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              onClick={() => setEmpleadoAReactivar(null)}
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

export default Empleados;
