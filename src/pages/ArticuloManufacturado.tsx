import React, { useState } from "react";
import HeaderAdmin from "../components/HeaderAdmin";
import SideBar from "../components/SideBar";
import Modal from "../components/Modal";
import { Boton } from "../components/Boton";

interface ArticuloManufacturado {
  id: number;
  denominacion: string;
  precioVenta: number;
  tiempoEstimadoMinutos: number;
  preparacion: string;
  categoria: string;
  unidadMedida: string;
}

export const ArticuloManufacturados = () => {
  const [articulos, setArticulos] = useState<ArticuloManufacturado[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [articuloEditandoId, setArticuloEditandoId] = useState<number | null>(
    null
  );

  const [nuevoArticulo, setNuevoArticulo] = useState<ArticuloManufacturado>({
    id: 0,
    denominacion: "",
    precioVenta: 0,
    tiempoEstimadoMinutos: 0,
    preparacion: "",
    categoria: "",
    unidadMedida: "Unidad",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNuevoArticulo({
      ...nuevoArticulo,
      [name]:
        name === "precioVenta" || name === "tiempoEstimadoMinutos"
          ? Number(value)
          : value,
    });
  };

  const abrirModalAgregar = () => {
    setNuevoArticulo({
      id: 0,
      denominacion: "",
      precioVenta: 0,
      tiempoEstimadoMinutos: 0,
      preparacion: "",
      categoria: "",
      unidadMedida: "Unidad",
    });
    setModoEdicion(false);
    setArticuloEditandoId(null);
    setMostrarModal(true);
  };

  const abrirModalEditar = (articulo: ArticuloManufacturado) => {
    setNuevoArticulo(articulo);
    setModoEdicion(true);
    setArticuloEditandoId(articulo.id);
    setMostrarModal(true);
  };

  const handleAgregarArticulo = () => {
    const nuevoId =
      articulos.length > 0 ? Math.max(...articulos.map((a) => a.id)) + 1 : 1;
    const articuloConId = { ...nuevoArticulo, id: nuevoId };
    setArticulos([...articulos, articuloConId]);
    setMostrarModal(false);
  };

  const handleEditarArticulo = () => {
    if (articuloEditandoId === null) return;
    setArticulos(
      articulos.map((art) =>
        art.id === articuloEditandoId
          ? { ...nuevoArticulo, id: articuloEditandoId }
          : art
      )
    );
    setMostrarModal(false);
  };

  const handleEliminarArticulo = (id: number) => {
    const confirmar = window.confirm(
      "¿Estás seguro de eliminar este artículo?"
    );
    if (confirmar) {
      setArticulos(articulos.filter((art) => art.id !== id));
    }
  };

  return (
    <div className="flex">
      <SideBar />
      <div className="flex-1">
        <HeaderAdmin />

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Artículos Manufacturados</h1>

          <Boton
            tipo="button"
            textoBoton="Agregar nuevo"
            onClick={abrirModalAgregar}
            estiloBoton="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
          />

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 border">ID</th>
                  <th className="px-4 py-2 border">Denominación</th>
                  <th className="px-4 py-2 border">Precio</th>
                  <th className="px-4 py-2 border">Tiempo (min)</th>
                  <th className="px-4 py-2 border">Preparación</th>
                  <th className="px-4 py-2 border">Categoría</th>
                  <th className="px-4 py-2 border">Unidad de medida</th>
                  <th className="px-4 py-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {articulos.map((articulo) => (
                  <tr key={articulo.id} className="text-center">
                    <td className="border px-4 py-2">{articulo.id}</td>
                    <td className="border px-4 py-2">
                      {articulo.denominacion}
                    </td>
                    <td className="border px-4 py-2">{articulo.precioVenta}</td>
                    <td className="border px-4 py-2">
                      {articulo.tiempoEstimadoMinutos}
                    </td>
                    <td className="border px-4 py-2">{articulo.preparacion}</td>
                    <td className="border px-4 py-2">{articulo.categoria}</td>
                    <td className="border px-4 py-2">
                      {articulo.unidadMedida}
                    </td>
                    <td className="border px-4 py-2 space-x-2">
                      <button
                        className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500"
                        onClick={() => abrirModalEditar(articulo)}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-red-500 px-2 py-1 rounded hover:bg-red-600 text-white"
                        onClick={() => handleEliminarArticulo(articulo.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {articulos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-4 text-gray-500">
                      No hay artículos cargados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Modal usando el componente Modal */}
          <Modal isOpen={mostrarModal} onClose={() => setMostrarModal(false)}>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">
                {modoEdicion ? "Editar artículo" : "Agregar nuevo artículo"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label htmlFor="denominacion" className="mb-1 font-semibold">
                  Denominación *
                </label>
                <input
                  name="denominacion"
                  value={nuevoArticulo.denominacion}
                  onChange={handleInputChange}
                  placeholder="Ej: Porktor doble"
                  className="border px-2 py-1 rounded"
                />
                <label htmlFor="precioVenta" className="mb-1 font-semibold">
                  Precio Venta *
                </label>
                <input
                  name="precioVenta"
                  value={nuevoArticulo.precioVenta}
                  onChange={handleInputChange}
                  placeholder="Precio"
                  className="border px-2 py-1 rounded"
                />
                <label
                  htmlFor="tiempoEstimadoMinutos"
                  className="mb-1 font-semibold"
                >
                  Tiempo Estimado(min) *
                </label>
                <input
                  name="tiempoEstimadoMinutos"
                  type="number"
                  value={nuevoArticulo.tiempoEstimadoMinutos}
                  onChange={handleInputChange}
                  placeholder="Tiempo (min)"
                  className="border px-2 py-1 rounded"
                  min={0}
                />
                <label htmlFor="preparacion" className="mb-1 font-semibold">
                  Preparación *
                </label>
                <input
                  name="preparacion"
                  value={nuevoArticulo.preparacion}
                  onChange={handleInputChange}
                  placeholder="Ej: 2 medallones de carne..."
                  className="border px-2 py-1 rounded"
                />
                <label htmlFor="categoria" className="mb-1 font-semibold">
                  Categoría *
                </label>
                <input
                  name="categoria"
                  value={nuevoArticulo.categoria}
                  onChange={handleInputChange}
                  placeholder="Ej: hamburguesa/pizza"
                  className="border px-2 py-1 rounded"
                />
                <label htmlFor="unidadMedida" className="mb-1 font-semibold">
                  Unidad de Medida *
                </label>
                <select
                  name="unidadMedida"
                  value={nuevoArticulo.unidadMedida}
                  onChange={handleInputChange}
                  className="border px-2 py-1 rounded"
                >
                  <option value="Litro">Litro</option>
                  <option value="Gramos">Gramos</option>
                  <option value="Unidad">Unidad</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="flex justify-end mt-6">
                <Boton
                  tipo="button"
                  textoBoton={
                    modoEdicion ? "Guardar cambios" : "Agregar artículo"
                  }
                  onClick={
                    modoEdicion ? handleEditarArticulo : handleAgregarArticulo
                  }
                  estiloBoton="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                />
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ArticuloManufacturados;
