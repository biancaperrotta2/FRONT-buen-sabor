import React, { useEffect, useState } from "react";
import HeaderAdmin from "../components/HeaderAdmin";
import SideBar from "../components/SideBar";
import Modal from "../components/Modal";
import { Boton } from "../components/Boton";
import EncabezadoOrdenable from "../components/EncabezadoOrdenable";
import Paginador from "../components/Paginador";
import InputNumerico from "../components/InputNumerico";
import { apiFetchJson, mensajeDeError } from "../api/client";
import { urlDeImagen } from "../utils/imagen";
import {
  subirImagen,
  TAMANIO_MAXIMO_IMAGEN_MB,
  TIPOS_IMAGEN_PERMITIDOS,
} from "../services/imagenService";
import { useProductos, type ManufacturadoDto } from "../context/ProductosContext";
import { useCategoria } from "../context/CategoriaContext";
import { useTablaServidor } from "../hooks/useTablaServidor";
import { listarProductosAdmin } from "../services/productoService";
import type { ArticuloManufacturado as ArticuloManufacturadoModel } from "../classes/ArticuloManufacturadoClass";

// Ítem candidato a ingrediente: solo insumos y semielaborados pueden formar parte de la
// receta de un producto (nunca otro plato final ni una promoción — lo valida el backend en
// ArticuloManufacturadoServiceImpl.construirDetalles).
interface ItemIngrediente {
  id: number;
  denominacion: string;
  esSemielaborado: boolean;
}

interface DetalleForm {
  idComponente: number;
  nombreComponente: string;
  esSemielaborado: boolean;
  cantidad: number | "";
}

type FormManufacturado = Omit<ManufacturadoDto, "precioVenta" | "tiempoEstimado" | "detalles"> & {
  precioVenta: number | "";
  tiempoEstimado: number | "";
  detalles: DetalleForm[];
};

const FORM_INICIAL: FormManufacturado = {
  denominacion: "",
  precioVenta: "",
  descripcion: "",
  tiempoEstimado: "",
  preparacion: "",
  unidadMedida: null,
  categoria: null,
  detalles: [],
};

export const ArticuloManufacturados = () => {
  // Las mutaciones siguen viviendo en el contexto (comparten los endpoints con el catálogo
  // público); las filas de la tabla, en cambio, vienen del endpoint paginado dedicado al admin.
  const { agregarProducto, actualizarProducto, eliminarProducto } = useProductos();
  const { categorias } = useCategoria();
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
    error,
    recargar,
  } = useTablaServidor<ArticuloManufacturadoModel>(listarProductosAdmin);
  const productos = datos?.contenido ?? [];

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [articuloEditandoId, setArticuloEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormManufacturado>(FORM_INICIAL);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);

  // Buscador de ingredientes (insumos + semielaborados) para armar la receta.
  const [busquedaIngrediente, setBusquedaIngrediente] = useState("");
  const [resultadosIngrediente, setResultadosIngrediente] = useState<ItemIngrediente[]>([]);
  const [buscandoIngrediente, setBuscandoIngrediente] = useState(false);

  const fotoMostrada = vistaPrevia ?? urlDeImagen(form.imagenUrl);

  useEffect(() => {
    if (!mostrarModal || !busquedaIngrediente.trim()) {
      setResultadosIngrediente([]);
      return;
    }
    let cancelado = false;
    setBuscandoIngrediente(true);
    const timeout = setTimeout(async () => {
      try {
        const query = `busqueda=${encodeURIComponent(busquedaIngrediente)}&page=0&size=6`;
        const [insumos, semielaborados] = await Promise.all([
          apiFetchJson<{ contenido: { id: number; denominacion: string }[] }>(`/insumos/all?${query}`),
          apiFetchJson<{ id: number; denominacion: string }[]>(`/articulo-manufacturado/semielaborados`),
        ]);
        if (cancelado) return;
        const textoBusqueda = busquedaIngrediente.trim().toLowerCase();
        setResultadosIngrediente([
          ...insumos.contenido.map((i) => ({ ...i, esSemielaborado: false })),
          ...semielaborados
            .filter((s) => s.denominacion.toLowerCase().includes(textoBusqueda))
            .map((s) => ({ ...s, esSemielaborado: true })),
        ]);
      } catch {
        if (!cancelado) setResultadosIngrediente([]);
      } finally {
        if (!cancelado) setBuscandoIngrediente(false);
      }
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [busquedaIngrediente, mostrarModal]);

  const agregarIngrediente = (item: ItemIngrediente) => {
    setForm((prev) => {
      if (prev.detalles.some((d) => d.idComponente === item.id)) return prev;
      return {
        ...prev,
        detalles: [
          ...prev.detalles,
          {
            idComponente: item.id,
            nombreComponente: item.denominacion,
            esSemielaborado: item.esSemielaborado,
            cantidad: 1,
          },
        ],
      };
    });
    setBusquedaIngrediente("");
    setResultadosIngrediente([]);
  };

  const quitarIngrediente = (idComponente: number) => {
    setForm((prev) => ({ ...prev, detalles: prev.detalles.filter((d) => d.idComponente !== idComponente) }));
  };

  const cambiarCantidadIngrediente = (idComponente: number, cantidad: number | "") => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.map((d) => (d.idComponente === idComponente ? { ...d, cantidad } : d)),
    }));
  };

  const limpiarFotoElegida = () => {
    if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    setVistaPrevia(null);
    setArchivoNuevo(null);
  };

  const handleElegirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
      setErrorGuardado("La foto debe ser una imagen JPG, PNG o WEBP.");
      return;
    }
    if (archivo.size > TAMANIO_MAXIMO_IMAGEN_MB * 1024 * 1024) {
      setErrorGuardado(`La foto supera el máximo de ${TAMANIO_MAXIMO_IMAGEN_MB} MB.`);
      return;
    }
    setErrorGuardado(null);
    limpiarFotoElegida();
    setArchivoNuevo(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
  };

  const handleQuitarFoto = () => {
    limpiarFotoElegida();
    setForm((prev) => ({ ...prev, imagenUrl: null }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    const seleccionada = categorias.find((c) => c.id === id) ?? null;
    setForm((prev) => ({ ...prev, categoria: seleccionada }));
  };

  const abrirModalAgregar = () => {
    setErrorGuardado(null);
    limpiarFotoElegida();
    setBusquedaIngrediente("");
    setForm(FORM_INICIAL);
    setModoEdicion(false);
    setArticuloEditandoId(null);
    setMostrarModal(true);
  };

  // La fila de la tabla no trae la preparación ni la foto: se pide el producto completo.
  const abrirModalEditar = async (articulo: ArticuloManufacturadoModel) => {
    try {
      const completo = await apiFetchJson<any>(`/articulo-manufacturado/${articulo.id}`);
      setErrorGuardado(null);
      limpiarFotoElegida();
      setBusquedaIngrediente("");
      setForm({
        imagenUrl: completo.imagenes?.[0]?.url ?? null,
        denominacion: completo.denominacion,
        precioVenta: completo.precioVenta,
        descripcion: completo.descripcion ?? "",
        tiempoEstimado: completo.tiempoEstimado ?? 0,
        preparacion: completo.preparacion ?? "",
        unidadMedida: articulo.unidadMedida,
        categoria: categorias.find((c) => c.id === completo.categoria?.id) ?? articulo.categoria,
        detalles: (completo.detalles ?? []).map((d: any) => ({
          idComponente: d.idComponente,
          nombreComponente: d.nombreComponente,
          esSemielaborado: Boolean(d.esSemielaborado),
          cantidad: d.cantidad,
        })),
      });
      setModoEdicion(true);
      setArticuloEditandoId(articulo.id ?? null);
      setMostrarModal(true);
    } catch (error) {
      alert(`No se pudo abrir el producto: ${mensajeDeError(error)}`);
    }
  };

  const handleGuardar = async () => {
    if (!form.denominacion.trim() || !form.categoria) {
      setErrorGuardado("Denominación y categoría son obligatorias.");
      return;
    }
    if (form.precioVenta === "" || form.precioVenta <= 0) {
      setErrorGuardado("El precio de venta debe ser mayor a 0.");
      return;
    }
    if (!form.descripcion.trim() || !form.preparacion.trim()) {
      setErrorGuardado("La descripción y la preparación son obligatorias.");
      return;
    }
    if (form.detalles.some((d) => d.cantidad === "" || d.cantidad <= 0)) {
      setErrorGuardado("Todos los ingredientes necesitan una cantidad mayor a 0.");
      return;
    }
    if (guardando) return;
    setErrorGuardado(null);
    setGuardando(true);
    try {
      // La foto se sube recién al guardar (así cancelar no deja archivos sueltos en Cloudinary).
      // Si el guardado del producto falla después, la URL queda en el formulario para reintentar
      // sin volver a subirla.
      let imagenUrl = form.imagenUrl ?? null;
      if (archivoNuevo) {
        imagenUrl = await subirImagen(archivoNuevo);
        limpiarFotoElegida();
        setForm((prev) => ({ ...prev, imagenUrl }));
      }
      const datos: ManufacturadoDto = {
        ...form,
        imagenUrl,
        precioVenta: form.precioVenta,
        tiempoEstimado: form.tiempoEstimado === "" ? 0 : form.tiempoEstimado,
        detalles: form.detalles.map((d) => ({
          idComponente: d.idComponente,
          cantidad: d.cantidad === "" ? 0 : d.cantidad,
        })),
      };
      if (modoEdicion && articuloEditandoId !== null) {
        await actualizarProducto(articuloEditandoId, datos);
      } else {
        await agregarProducto(datos);
      }
      recargar();
      setMostrarModal(false);
    } catch (error) {
      setErrorGuardado(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id?: number) => {
    if (id === undefined) return;
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await eliminarProducto(id);
        recargar();
      } catch (error) {
        alert(`No se pudo eliminar el producto: ${mensajeDeError(error)}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAdmin />
      <div className="flex flex-1 overflow-auto">
        <SideBar />
        <main className="flex-1 py-10 px-10 pb-10 bg-gray-100">
          <div className="flex justify-between items-center pb-4">
            <h1 className="text-2xl font-semibold">Productos</h1>
            <Boton
              tipo="button"
              textoBoton="Añadir"
              onClick={abrirModalAgregar}
              estiloBoton="border rounded-md py-2 px-8 font-semibold text-sm bg-[#d6aa7b] text-white hover:bg-[#c69a69] transition"
            />
          </div>

          <input
            type="text"
            placeholder="Buscar por denominación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full max-w-sm mb-4 border rounded-md px-3 py-2 text-sm"
          />

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Foto</th>
                  <EncabezadoOrdenable campo="nombre" etiqueta="Denominación" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <EncabezadoOrdenable campo="precioVenta" etiqueta="Precio" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-4 py-3 text-left">Tiempo (min)</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                )}
                {productos.map((articulo) => (
                  <tr key={articulo.id} className="border-b">
                    <td className="px-4 py-2">
                      {urlDeImagen(articulo.imagen) ? (
                        <img
                          src={urlDeImagen(articulo.imagen)!}
                          alt={`Foto de ${articulo.denominacion}`}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                          className="h-10 w-10 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{articulo.denominacion}</td>
                    <td className="px-4 py-2">{articulo.descripcion}</td>
                    <td className="px-4 py-2">${articulo.precioVenta}</td>
                    <td className="px-4 py-2">{articulo.tiempoEstimado}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                        onClick={() => abrirModalEditar(articulo)}
                      >
                        Editar
                      </button>
                      <button
                        className="cursor-pointer bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded"
                        onClick={() => handleEliminar(articulo.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {!cargando && productos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500">
                      No hay productos que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
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

          <Modal isOpen={mostrarModal} onClose={() => setMostrarModal(false)} className="max-w-2xl w-full">
            <div className="p-2">
              <h2 className="text-xl font-semibold mb-4">
                {modoEdicion ? "Editar producto" : "Nuevo producto"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="mb-1 font-semibold">Denominación *</label>
                <input
                  name="denominacion"
                  value={form.denominacion}
                  onChange={handleInputChange}
                  placeholder="Ej: Porktor doble"
                  className="border px-2 py-1 rounded"
                />
                <label className="mb-1 font-semibold">Precio Venta *</label>
                <InputNumerico
                  name="precioVenta"
                  value={form.precioVenta}
                  onChange={(valor) => setForm((prev) => ({ ...prev, precioVenta: valor }))}
                  className="border px-2 py-1 rounded"
                />
                <label className="mb-1 font-semibold">Tiempo Estimado (min)</label>
                <InputNumerico
                  name="tiempoEstimado"
                  decimales={false}
                  value={form.tiempoEstimado}
                  onChange={(valor) => setForm((prev) => ({ ...prev, tiempoEstimado: valor }))}
                  className="border px-2 py-1 rounded"
                />
                <label className="mb-1 font-semibold">Descripción *</label>
                <input
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleInputChange}
                  placeholder="Ej: Doble medallón de cerdo con queso"
                  className="border px-2 py-1 rounded"
                />
                <label className="mb-1 font-semibold">Preparación *</label>
                <textarea
                  name="preparacion"
                  value={form.preparacion}
                  onChange={handleInputChange}
                  placeholder="Ej: 2 medallones de carne..."
                  className="border px-2 py-1 rounded"
                />
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 p-3">
                <label className="font-semibold text-sm">Receta (ingredientes)</label>
                <p className="text-xs text-gray-500 mb-1">
                  Se descuentan del stock automáticamente en cada venta. Sin ingredientes cargados,
                  no se descuenta stock de nada al vender este producto.
                </p>
                <div className="relative mt-1">
                  <input
                    value={busquedaIngrediente}
                    onChange={(e) => setBusquedaIngrediente(e.target.value)}
                    placeholder="Buscar insumo o semielaborado para agregar..."
                    className="border px-2 py-1 rounded w-full"
                  />
                  {busquedaIngrediente.trim() && (
                    <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border rounded shadow">
                      {buscandoIngrediente && <p className="text-xs text-gray-500 px-2 py-1">Buscando...</p>}
                      {!buscandoIngrediente && resultadosIngrediente.length === 0 && (
                        <p className="text-xs text-gray-500 px-2 py-1">Sin resultados.</p>
                      )}
                      {resultadosIngrediente.map((item) => (
                        <button
                          type="button"
                          key={`${item.esSemielaborado ? "semi" : "insumo"}-${item.id}`}
                          onClick={() => agregarIngrediente(item)}
                          className="cursor-pointer w-full text-left px-2 py-1 text-sm hover:bg-gray-100 flex justify-between"
                        >
                          <span>{item.denominacion}</span>
                          <span className="text-xs text-gray-400">
                            {item.esSemielaborado ? "Semielaborado" : "Insumo"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {form.detalles.length > 0 && (
                  <table className="w-full text-sm mt-3">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="pb-1">Ingrediente</th>
                        <th className="pb-1">Cantidad</th>
                        <th className="pb-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.detalles.map((d) => (
                        <tr key={d.idComponente} className="border-t">
                          <td className="py-1">
                            {d.nombreComponente}{" "}
                            <span className="text-xs text-gray-400">
                              ({d.esSemielaborado ? "Semielaborado" : "Insumo"})
                            </span>
                          </td>
                          <td className="py-1 w-24">
                            <InputNumerico
                              value={d.cantidad}
                              onChange={(valor) => cambiarCantidadIngrediente(d.idComponente, valor)}
                              className="border px-2 py-1 rounded w-full"
                            />
                          </td>
                          <td className="py-1 text-right">
                            <button
                              type="button"
                              onClick={() => quitarIngrediente(d.idComponente)}
                              className="cursor-pointer text-red-500 hover:text-red-700 text-xs"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <label className="mb-1 font-semibold">Foto</label>
                <div className="flex flex-col gap-2">
                  {fotoMostrada && (
                    <img
                      src={fotoMostrada}
                      alt="Vista previa de la foto"
                      className="h-32 w-full max-w-xs object-cover rounded border"
                    />
                  )}
                  <div className="flex gap-2">
                    <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded">
                      {fotoMostrada ? "Cambiar foto" : "Elegir foto"}
                      <input
                        type="file"
                        accept={TIPOS_IMAGEN_PERMITIDOS.join(",")}
                        className="hidden"
                        onChange={handleElegirFoto}
                      />
                    </label>
                    {fotoMostrada && (
                      <button
                        type="button"
                        onClick={handleQuitarFoto}
                        className="cursor-pointer bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    JPG, PNG o WEBP, máximo {TAMANIO_MAXIMO_IMAGEN_MB} MB. Es opcional.
                  </span>
                </div>
                <label className="mb-1 font-semibold">Categoría *</label>
                <select
                  value={form.categoria?.id ?? ""}
                  onChange={handleCategoriaChange}
                  className="border px-2 py-1 rounded"
                >
                  <option value="" disabled>
                    Seleccione una categoría
                  </option>
                  {categorias.filter((c) => c.tipo === "PRODUCTO").map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.denominacion}
                    </option>
                  ))}
                </select>
              </div>
              {errorGuardado && (
                <p role="alert" className="mt-4 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2">
                  No se pudo guardar el producto: {errorGuardado}
                </p>
              )}
              <div className="flex justify-end mt-6">
                <Boton
                  tipo="button"
                  textoBoton={
                    guardando ? "Guardando..." : modoEdicion ? "Guardar cambios" : "Agregar producto"
                  }
                  onClick={handleGuardar}
                  estiloBoton="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                />
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
};

export default ArticuloManufacturados;
