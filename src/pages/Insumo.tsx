import { useState } from "react";
import HeaderAdmin from "../components/HeaderAdmin";
import SideBar from "../components/SideBar";
import { Boton } from "../components/Boton";
import { Modal } from "../components/Modal";
import { FormularioInsumo } from "../components/FormularioInsumo";
import type { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import type { Categoria } from "../classes/CategoriaClass";
import type { UnidadMedida } from "../classes/UnidadMedidaClass";
import { useInsumos } from "../context/InsumosContext";
import { useCategoria } from "../context/CategoriaContext";

export interface InsumoDto {
  id?: number;
  denominacion: string;
  precioVenta: number;
  precioCompra: number;
  stockActual: number;
  stockMaximo: number;
  esParaElaborar: boolean;
  unidadMedida: UnidadMedida;
  categoria: Categoria;
}

export const Insumos = () => {
  const {
    insumos,
    agregarInsumo,
    editarInsumo,
    eliminarInsumo,
    unidadesMedida,
  } = useInsumos();
  const { categorias } = useCategoria();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [insumoEnEdicion, setInsumoEnEdicion] = useState<ArticuloInsumo | null>(
    null
  );

  // Estados controlados para el formulario
  const [denominacion, setDenominacion] = useState("");
  const [precioCompra, setPrecioCompra] = useState<number | "">("");
  const [precioVenta, setPrecioVenta] = useState<number | "">("");
  const [stockActual, setStockActual] = useState<number | "">("");
  const [stockMaximo, setStockMaximo] = useState<number | "">("");
  const [esParaElaborar, setEsParaElaborar] = useState(false);
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);

  console.log(insumos);
  console.log(unidadMedida);
  // Cuando abro el modal para crear
  const handleAbrirModal = () => {
    setModoEdicion(false);
    setInsumoEnEdicion(null);
    limpiarCampos();
    setIsModalOpen(true);
  };

  // Cuando abro el modal para editar un insumo
  const handleEditar = (insumo: ArticuloInsumo) => {
    console.log("EDITANDO ARITUCLO INSUMO");
    console.log(insumo);
    setModoEdicion(true);
    setInsumoEnEdicion(insumo);
    console.log(modoEdicion);
    // Cargar los datos del insumo en los campos
    setDenominacion(insumo.denominacion);
    setPrecioCompra(insumo.precioCompra);
    setPrecioVenta(insumo.precioVenta);
    setStockActual(insumo.stockActual);
    setStockMaximo(insumo.stockMaximo);
    setEsParaElaborar(insumo.esParaElaborar);
    setUnidadMedida(insumo.unidadMedida || null);
    setCategoria(insumo.categoria || null);

    setIsModalOpen(true);
  };

  const limpiarCampos = () => {
    setDenominacion("");
    setPrecioCompra("");
    setPrecioVenta("");
    setStockActual("");
    setStockMaximo("");
    setEsParaElaborar(false);
    setUnidadMedida(null);
    setCategoria(null);
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    limpiarCampos();
    setModoEdicion(false);
    setInsumoEnEdicion(null);
  };

  const handleGuardar = (insumoDto: InsumoDto) => {
    if (modoEdicion && insumoEnEdicion?.id !== undefined) {
      editarInsumo(insumoEnEdicion.id, insumoDto);
    } else {
      agregarInsumo(insumoDto);
    }
    handleCerrarModal();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAdmin />
      <div className="flex flex-1 overflow-auto">
        <SideBar />

        <main className="flex-1 py-10 px-10 pb-10 bg-gray-100">
          <div className="flex justify-between items-center pb-4">
            <h1 className="text-2xl font-semibold">Insumos</h1>
            <Boton
              estiloBoton="border rounded-md py-2 px-8 font-semibold text-sm bg-yellow-400 text-white hover:bg-yellow-500 transition"
              textoBoton="Añadir"
              onClick={handleAbrirModal}
            />
          </div>

          <div className="overflow-x-auto mt-6 rounded-lg shadow">
            <table className="min-w-full bg-white text-sm text-gray-700">
              <thead className="bg-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Denominación</th>
                  <th className="px-4 py-3 text-left">Precio Compra</th>
                  <th className="px-4 py-3 text-left">Precio Venta</th>
                  <th className="px-4 py-3 text-left">Stock Actual</th>
                  <th className="px-4 py-3 text-left">Stock Máximo</th>
                  <th className="px-4 py-3 text-left">Para Elaborar</th>
                  <th className="px-4 py-3 text-left">Unidad de Medida</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((insumo) => (
                  <tr key={insumo.id} className="border-b">
                    <td className="px-4 py-2">{insumo.denominacion}</td>
                    <td className="px-4 py-2">
                      ${insumo.precioCompra.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      ${insumo.precioVenta.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">{insumo.stockActual}</td>
                    <td className="px-4 py-2">{insumo.stockMaximo}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block w-6 h-6 rounded-full ${
                          insumo.esParaElaborar ? "bg-green-500" : "bg-red-500"
                        }`}
                        title={
                          insumo.esParaElaborar
                            ? "Para elaborar"
                            : "No para elaborar"
                        }
                      ></span>
                    </td>
                    <td className="px-4 py-2">
                      {insumo.unidadMedida?.denominacion || "-"}
                    </td>
                    <td className="px-4 py-2">
                      {insumo.categoria?.denominacion || "-"}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                        onClick={() => handleEditar(insumo)}
                      >
                        Editar
                      </button>
                      <button
                        className="cursor-pointer bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                        onClick={() => eliminarInsumo(insumo.id!)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={handleCerrarModal}
            titulo={modoEdicion ? "Editar Insumo" : "Nuevo Insumo"}
            className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-lg"
          >
            <FormularioInsumo
              modoEdicion={modoEdicion}
              setModoEdicion={setModoEdicion}
              denominacion={denominacion}
              setDenominacion={setDenominacion}
              precioCompra={precioCompra}
              setPrecioCompra={setPrecioCompra}
              precioVenta={precioVenta}
              setPrecioVenta={setPrecioVenta}
              stockActual={stockActual}
              setStockActual={setStockActual}
              stockMaximo={stockMaximo}
              setStockMaximo={setStockMaximo}
              esParaElaborar={esParaElaborar}
              setEsParaElaborar={setEsParaElaborar}
              unidadMedida={unidadMedida}
              setUnidadMedida={setUnidadMedida}
              categoria={categoria}
              setCategoria={setCategoria}
              unidadesMedida={unidadesMedida}
              categorias={categorias}
              onSubmit={handleGuardar}
              onCancel={handleCerrarModal}
            />
          </Modal>
        </main>
      </div>
    </div>
  );
};
