import { useState } from "react";
import HeaderAdmin from "../components/HeaderAdmin";
import SideBar from "../components/SideBar";
import { Boton } from "../components/Boton";
import { Modal } from "../components/Modal";
import EncabezadoOrdenable from "../components/EncabezadoOrdenable";
import Paginador from "../components/Paginador";
import { useCategoria } from "../context/CategoriaContext";
import type { Categoria, TipoCategoria } from "../classes/CategoriaClass";
import { FormularioCategorias } from "../components/FormularioCategoria";
import { useTablaServidor } from "../hooks/useTablaServidor";
import { listarCategoriasAdmin } from "../services/categoriaService";
import { mensajeDeError } from "../api/client";

export interface CategoriaDto {
  id?: number;
  denominacion: string;
  categoriaPadreId: number | null;
  tipo?: TipoCategoria;
}

export interface CategoriaPadreDto {
  id?: number;
  denominacion: string;
}

export const Categorias = () => {
  // Se sigue usando el contexto solo para eliminarCategoria (y para que el formulario de
  // alta/edición tenga la lista completa en su <select> de categoría padre); las filas que
  // se muestran en la tabla vienen del endpoint paginado, no de categorias del contexto.
  const { eliminarCategoria } = useCategoria();
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
  } = useTablaServidor<Categoria>(listarCategoriasAdmin);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] =
    useState<Categoria | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [categoriaEnEdicion, setCategoriaEnEdicion] =
    useState<Categoria | null>(null);

  const handleAbrirModal = () => {
    setModoEdicion(false);
    setCategoriaEnEdicion(null);
    setIsModalOpen(true);
  };

  const handleEditar = (categoria: Categoria) => {
    setModoEdicion(true);
    setCategoriaEnEdicion(categoria);
    setIsModalOpen(true);
  };

  const handleEliminar = (categoria: Categoria) => {
    setCategoriaAEliminar(categoria);
    setModalEliminarAbierto(true);
  };

  const confirmarEliminar = async () => {
    const aEliminar = categoriaAEliminar;
    setCategoriaAEliminar(null);
    setModalEliminarAbierto(false);
    if (aEliminar?.id === undefined) return;
    try {
      await eliminarCategoria(aEliminar.id);
    } catch (error) {
      alert(`No se pudo eliminar la categoría: ${mensajeDeError(error)}`);
    }
    recargar();
  };

  const cancelarEliminar = () => {
    setCategoriaAEliminar(null);
    setModalEliminarAbierto(false);
  };

  const handleCerrarModal = () => {
    // FormularioCategorias no distingue "cancelar" de "guardado con éxito" en su prop
    // onClose, así que recargamos siempre: de más no molesta (mismo dato, otro fetch).
    recargar();
    setIsModalOpen(false);
    setModoEdicion(false);
    setCategoriaEnEdicion(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAdmin />

      <div className="flex flex-1 overflow-auto">
        <SideBar />

        <main className="flex-1 py-10 px-10 pb-10 bg-gray-100">
          <div className="flex justify-between items-center pb-4">
            <h1 className="text-2xl font-semibold">Categorías</h1>
            <Boton
              estiloBoton="border rounded-md py-2 px-8 font-semibold text-sm bg-[#d6aa7b] text-white hover:bg-[#c69a69] transition"
              textoBoton="Añadir"
              onClick={handleAbrirModal}
            />
          </div>

          <input
            type="text"
            placeholder="Buscar por denominación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full max-w-sm mb-4 border rounded-md px-3 py-2 text-sm"
          />

          {errorCarga && <p className="text-red-600 text-sm mb-4">{errorCarga}</p>}

          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full text-sm text-center">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <EncabezadoOrdenable campo="denominacion" etiqueta="Denominación" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Categoría Padre</th>
                  <th className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-800">
                {cargando && (
                  <tr>
                    <td colSpan={4} className="px-6 py-6 text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                )}
                {!cargando && (datos?.contenido.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-6 text-gray-500">
                      No hay categorías que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
                {(datos?.contenido ?? []).map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">
                      {cat.denominacion}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          cat.tipo === "INSUMO" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {cat.tipo === "INSUMO" ? "Insumos" : "Productos"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {cat.categoriaPadre?.denominacion ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          className="cursor-pointer rounded-md px-6 py-2 text-white bg-blue-500 hover:bg-blue-300"
                          onClick={() => handleEditar(cat)}
                        >
                          Editar
                        </button>
                        <button
                          className="cursor-pointer rounded-md px-6 py-2 text-white bg-red-500 hover:bg-red-300"
                          onClick={() => handleEliminar(cat)}
                        >
                          Eliminar
                        </button>
                      </div>
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
        isOpen={modalEliminarAbierto}
        onClose={cancelarEliminar}
        titulo="Confirmar Eliminación"
      >
        <div className="text-center">
          <p className="mb-4">
            ¿Estás seguro que querés eliminar la categoría{" "}
            <strong>{categoriaAEliminar?.denominacion}</strong>?
          </p>
          <div className="flex justify-center gap-4">
            <button
              className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              onClick={cancelarEliminar}
            >
              Cancelar
            </button>
            <button
              className="cursor-pointer bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
              onClick={confirmarEliminar}
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCerrarModal}
        titulo={modoEdicion ? "Editar Categoría" : "Nueva Categoría"}
      >
        <FormularioCategorias
          onClose={handleCerrarModal}
          modoEdicion={modoEdicion}
          categoriaEnEdicion={categoriaEnEdicion}
        />
      </Modal>
    </div>
  );
};
