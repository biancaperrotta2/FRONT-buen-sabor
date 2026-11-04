import { useRef, useState } from "react";
import HeaderAdmin from "../components/HeaderAdmin";
import SideBar from "../components/SideBar";
import { Boton } from "../components/Boton";
import { Modal } from "../components/Modal";
import { FormularioInsumo } from "../components/FormularioInsumo";
import EncabezadoOrdenable from "../components/EncabezadoOrdenable";
import Paginador from "../components/Paginador";
import type { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import type { Categoria } from "../classes/CategoriaClass";
import type { UnidadMedida } from "../classes/UnidadMedidaClass";
import { useInsumos } from "../context/InsumosContext";
import { apiFetchJson, mensajeDeError } from "../api/client";
import { useCategoria } from "../context/CategoriaContext";
import { convertirCantidad, factorDeUnidad } from "../utils/unidades";
import { subirImagen } from "../services/imagenService";

interface UsoInsumo {
  recetas: { idProducto: number; producto: string; cantidad: number }[];
  promociones: string[];
}

interface ConfirmacionUnidad {
  dto: InsumoDto;
  unidadAntes: string;
  unidadDespues: string;
  ajustes: { producto: string; antes: number; despues: number }[];
}

export interface InsumoDto {
  id?: number;
  denominacion: string;
  precioVenta: number;
  precioCompra: number;
  margen: number | null;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  esParaElaborar: boolean;
  unidadMedida: UnidadMedida;
  categoria: Categoria;
  // Foto ya subida (o la que tenía); archivoFoto es una nueva elegida que se sube al guardar.
  imagenUrl?: string | null;
  archivoFoto?: File | null;
}

export const Insumos = () => {
  const {
    insumos,
    datosPagina,
    busqueda,
    setBusqueda,
    pagina,
    setPagina,
    ordenarPor,
    direccion,
    alClickearColumna,
    cargandoInsumos,
    errorInsumos,
    agregarInsumo,
    editarInsumo,
    eliminarInsumo,
    unidadesMedida,
  } = useInsumos();
  const { categorias } = useCategoria();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [confirmacionUnidad, setConfirmacionUnidad] = useState<ConfirmacionUnidad | null>(null);
  const fotoSubidaRef = useRef<{ archivo: File; url: string } | null>(null);
  const [insumoEnEdicion, setInsumoEnEdicion] = useState<ArticuloInsumo | null>(
    null
  );

  // Estados controlados para el formulario
  const [denominacion, setDenominacion] = useState("");
  const [precioCompra, setPrecioCompra] = useState<number | "">("");
  const [precioVenta, setPrecioVenta] = useState<number | "">("");
  const [margen, setMargen] = useState<number | "">("");
  const [stockActual, setStockActual] = useState<number | "">("");
  const [stockMinimo, setStockMinimo] = useState<number | "">("");
  const [stockMaximo, setStockMaximo] = useState<number | "">("");
  const [esParaElaborar, setEsParaElaborar] = useState(true);
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);

  // Cuando abro el modal para crear
  const handleAbrirModal = () => {
    setModoEdicion(false);
    setInsumoEnEdicion(null);
    limpiarCampos();
    setIsModalOpen(true);
  };

  // Cuando abro el modal para editar un insumo
  const handleEditar = (insumo: ArticuloInsumo) => {
    setModoEdicion(true);
    setInsumoEnEdicion(insumo);
    // Cargar los datos del insumo en los campos
    setDenominacion(insumo.denominacion);
    setPrecioCompra(insumo.precioCompra);
    setPrecioVenta(insumo.precioVenta);
    setMargen(insumo.margen ?? "");
    setStockActual(insumo.stockActual);
    setStockMinimo(insumo.stockMinimo ?? 0);
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
    setMargen("");
    setStockActual("");
    setStockMinimo("");
    setStockMaximo("");
    setEsParaElaborar(true); // la mayoría de los insumos son ingredientes
    setUnidadMedida(null);
    setCategoria(null);
  };

  const handleCerrarModal = () => {
    setErrorGuardado(null);
    setIsModalOpen(false);
    limpiarCampos();
    setModoEdicion(false);
    setInsumoEnEdicion(null);
  };

  const guardar = async (dto: InsumoDto) => {
    try {
      // La foto se sube recién al guardar (cancelar no deja archivos sueltos en Cloudinary). Si
      // el guardado falla y se reintenta con el mismo archivo, se reusa la URL ya subida.
      let insumoDto: InsumoDto = dto;
      if (dto.archivoFoto) {
        const yaSubida = fotoSubidaRef.current?.archivo === dto.archivoFoto ? fotoSubidaRef.current.url : null;
        const url = yaSubida ?? (await subirImagen(dto.archivoFoto));
        fotoSubidaRef.current = { archivo: dto.archivoFoto, url };
        insumoDto = { ...dto, imagenUrl: url, archivoFoto: null };
      }
      if (modoEdicion && insumoEnEdicion?.id !== undefined) {
        await editarInsumo(insumoEnEdicion.id, insumoDto);
      } else {
        await agregarInsumo(insumoDto);
      }
      handleCerrarModal();
    } catch (error) {
      setErrorGuardado(mensajeDeError(error));
    }
  };

  // Cambiar la unidad de un insumo usado en recetas hace que el backend convierta esas
  // cantidades (250 g -> 0,25 kg). Antes de guardar se muestra qué se va a ajustar.
  const handleGuardar = async (insumoDto: InsumoDto) => {
    setErrorGuardado(null);
    if (modoEdicion && insumoEnEdicion?.id !== undefined) {
      const unidadAntes = insumoEnEdicion.unidadMedida?.denominacion ?? "";
      const unidadDespues = insumoDto.unidadMedida?.denominacion ?? "";
      const factorAntes = factorDeUnidad(unidadAntes);
      const factorDespues = factorDeUnidad(unidadDespues);
      if (factorAntes !== null && factorDespues !== null && factorAntes !== factorDespues) {
        try {
          const uso = await apiFetchJson<UsoInsumo>(`/insumos/${insumoEnEdicion.id}/uso`);
          if (uso.promociones.length > 0) {
            setErrorGuardado(
              `no se puede cambiar la unidad porque está incluido directamente en: ${uso.promociones.join(", ")}. Quitalo de esas promociones primero.`
            );
            return;
          }
          if (uso.recetas.length > 0) {
            setConfirmacionUnidad({
              dto: insumoDto,
              unidadAntes,
              unidadDespues,
              ajustes: uso.recetas.map((r) => ({
                producto: r.producto,
                antes: r.cantidad,
                despues: convertirCantidad(r.cantidad, factorAntes, factorDespues),
              })),
            });
            return;
          }
        } catch (error) {
          setErrorGuardado(mensajeDeError(error));
          return;
        }
      }
    }
    await guardar(insumoDto);
  };

  const confirmarCambioUnidad = async () => {
    const pendiente = confirmacionUnidad;
    setConfirmacionUnidad(null);
    if (pendiente) await guardar(pendiente.dto);
  };

  const formatear = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 6 });

  const handleEliminar = async (id: number) => {
    try {
      await eliminarInsumo(id);
    } catch (error) {
      alert(`No se pudo eliminar el insumo: ${mensajeDeError(error)}`);
    }
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

          {errorInsumos && <p className="text-red-600 text-sm mb-4">{errorInsumos}</p>}

          <div className="overflow-x-auto mt-2 rounded-lg shadow">
            <table className="min-w-full bg-white text-sm text-gray-700">
              <thead className="bg-gray-200 text-gray-700 font-semibold">
                <tr>
                  <EncabezadoOrdenable campo="nombre" etiqueta="Denominación" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <EncabezadoOrdenable campo="precioCosto" etiqueta="Precio Compra" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <EncabezadoOrdenable campo="precioVenta" etiqueta="Precio Venta" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <EncabezadoOrdenable campo="stockActual" etiqueta="Stock Actual" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-4 py-3 text-left">Stock Mínimo</th>
                  <th className="px-4 py-3 text-left">Stock Máximo</th>
                  <th className="px-4 py-3 text-left">Para Elaborar</th>
                  <th className="px-4 py-3 text-left">Unidad de Medida</th>
                  <th className="px-4 py-3 text-left">Categoría</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargandoInsumos && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                )}
                {!cargandoInsumos && insumos.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-gray-500">
                      No hay insumos que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
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
                    <td className="px-4 py-2">{insumo.stockMinimo}</td>
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
                        onClick={() => handleEliminar(insumo.id!)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {datosPagina && (
              <Paginador
                pagina={pagina}
                totalPaginas={datosPagina.totalPaginas}
                totalElementos={datosPagina.totalElementos}
                tamanio={datosPagina.tamanio}
                onCambiarPagina={setPagina}
              />
            )}
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={handleCerrarModal}
            titulo={modoEdicion ? "Editar Insumo" : "Nuevo Insumo"}
            className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-lg"
          >
            {errorGuardado && (
              <p role="alert" className="mb-4 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2">
                No se pudo guardar el insumo: {errorGuardado}
              </p>
            )}
            <FormularioInsumo
              modoEdicion={modoEdicion}
              setModoEdicion={setModoEdicion}
              denominacion={denominacion}
              setDenominacion={setDenominacion}
              precioCompra={precioCompra}
              setPrecioCompra={setPrecioCompra}
              precioVenta={precioVenta}
              setPrecioVenta={setPrecioVenta}
              margen={margen}
              setMargen={setMargen}
              stockActual={stockActual}
              setStockActual={setStockActual}
              stockMinimo={stockMinimo}
              setStockMinimo={setStockMinimo}
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
              imagenUrlInicial={modoEdicion ? insumoEnEdicion?.imagen || null : null}
              onSubmit={handleGuardar}
              onCancel={handleCerrarModal}
            />
          </Modal>

          <Modal
            isOpen={confirmacionUnidad !== null}
            onClose={() => setConfirmacionUnidad(null)}
            titulo="Confirmar cambio de unidad"
          >
            {confirmacionUnidad && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  Vas a pasar <strong>{confirmacionUnidad.dto.denominacion}</strong> de{" "}
                  <strong>{confirmacionUnidad.unidadAntes}</strong> a{" "}
                  <strong>{confirmacionUnidad.unidadDespues}</strong>. Para que las recetas sigan usando la
                  misma cantidad real, se van a ajustar así:
                </p>
                <ul className="text-sm text-gray-800 rounded-md border border-gray-200 divide-y">
                  {confirmacionUnidad.ajustes.map((a) => (
                    <li key={a.producto} className="px-3 py-2 flex justify-between gap-4">
                      <span className="font-medium">{a.producto}</span>
                      <span>
                        {formatear(a.antes)} {confirmacionUnidad.unidadAntes} →{" "}
                        <strong>
                          {formatear(a.despues)} {confirmacionUnidad.unidadDespues}
                        </strong>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmacionUnidad(null)}
                    className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmarCambioUnidad}
                    className="cursor-pointer bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Cambiar unidad y ajustar recetas
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </main>
      </div>
    </div>
  );
};
