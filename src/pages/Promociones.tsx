import { useEffect, useState } from "react";
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
import { useCategoria } from "../context/CategoriaContext";
import { useTablaServidor } from "../hooks/useTablaServidor";
import {
  actualizarPromocion,
  cambiarEstadoHabilitacionPromocion,
  crearPromocion,
  listarPromocionesAdmin,
  obtenerPromocion,
  type PromocionAdminRow,
  type PromocionRequestDto,
  type TipoPromocionApi,
} from "../services/promocionService";

const TIPO_LABEL: Record<TipoPromocionApi, string> = {
  HAPPY_HOUR: "Happy Hour",
  VERANO: "Verano",
  INVIERNO: "Invierno",
};

interface ItemBuscable {
  id: number;
  denominacion: string;
  precioVenta: number;
  tipo: "Producto" | "Insumo";
}

interface DetalleForm {
  idArticulo: number;
  nombreArticulo: string;
  tipo: string;
  precioUnitario: number;
  cantidad: number | "";
}

interface FormPromocion {
  nombre: string;
  descripcionDescuento: string;
  fechaDesde: string;
  fechaHasta: string;
  horaDesde: string;
  horaHasta: string;
  precioVenta: number | "";
  tipoPromocion: TipoPromocionApi;
  idCategoria: number | "";
  imagenUrl: string | null;
  detalles: DetalleForm[];
}

const FORM_INICIAL: FormPromocion = {
  nombre: "",
  descripcionDescuento: "",
  fechaDesde: "",
  fechaHasta: "",
  horaDesde: "00:00",
  horaHasta: "23:59",
  precioVenta: "",
  tipoPromocion: "HAPPY_HOUR",
  idCategoria: "",
  imagenUrl: null,
  detalles: [],
};

export const Promociones = () => {
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
  } = useTablaServidor<PromocionAdminRow>(listarPromocionesAdmin);
  const promociones = datos?.contenido ?? [];

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [promoEditandoId, setPromoEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormPromocion>(FORM_INICIAL);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);

  // Buscador de ítems (productos + insumos) para armar el combo.
  const [busquedaItem, setBusquedaItem] = useState("");
  const [resultadosItem, setResultadosItem] = useState<ItemBuscable[]>([]);
  const [buscandoItem, setBuscandoItem] = useState(false);

  const fotoMostrada = vistaPrevia ?? urlDeImagen(form.imagenUrl);

  useEffect(() => {
    if (!mostrarModal || !busquedaItem.trim()) {
      setResultadosItem([]);
      return;
    }
    let cancelado = false;
    setBuscandoItem(true);
    const timeout = setTimeout(async () => {
      try {
        const query = `busqueda=${encodeURIComponent(busquedaItem)}&page=0&size=6`;
        const [productos, insumos] = await Promise.all([
          apiFetchJson<{ contenido: { id: number; denominacion: string; precioVenta: number }[] }>(
            `/articulo-manufacturado/admin?${query}`
          ),
          apiFetchJson<{ contenido: { id: number; denominacion: string; precioVenta: number }[] }>(
            `/insumos/all?${query}`
          ),
        ]);
        if (cancelado) return;
        setResultadosItem([
          ...productos.contenido.map((p) => ({ ...p, tipo: "Producto" as const })),
          ...insumos.contenido.map((i) => ({ ...i, tipo: "Insumo" as const })),
        ]);
      } catch {
        if (!cancelado) setResultadosItem([]);
      } finally {
        if (!cancelado) setBuscandoItem(false);
      }
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [busquedaItem, mostrarModal]);

  const agregarItem = (item: ItemBuscable) => {
    setForm((prev) => {
      if (prev.detalles.some((d) => d.idArticulo === item.id)) return prev;
      return {
        ...prev,
        detalles: [
          ...prev.detalles,
          {
            idArticulo: item.id,
            nombreArticulo: item.denominacion,
            tipo: item.tipo,
            precioUnitario: item.precioVenta,
            cantidad: 1,
          },
        ],
      };
    });
    setBusquedaItem("");
    setResultadosItem([]);
  };

  const quitarItem = (idArticulo: number) => {
    setForm((prev) => ({ ...prev, detalles: prev.detalles.filter((d) => d.idArticulo !== idArticulo) }));
  };

  const cambiarCantidadItem = (idArticulo: number, cantidad: number | "") => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.map((d) => (d.idArticulo === idArticulo ? { ...d, cantidad } : d)),
    }));
  };

  const precioDeLista = form.detalles.reduce(
    (total, d) => total + d.precioUnitario * (d.cantidad === "" ? 0 : d.cantidad),
    0
  );

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

  const abrirModalAgregar = () => {
    setErrorGuardado(null);
    limpiarFotoElegida();
    setBusquedaItem("");
    setForm(FORM_INICIAL);
    setModoEdicion(false);
    setPromoEditandoId(null);
    setMostrarModal(true);
  };

  const abrirModalEditar = async (promo: PromocionAdminRow) => {
    try {
      const completa = await obtenerPromocion(promo.id);
      setErrorGuardado(null);
      limpiarFotoElegida();
      setBusquedaItem("");
      setForm({
        nombre: completa.nombre,
        descripcionDescuento: completa.descripcionDescuento,
        fechaDesde: completa.fechaDesde,
        fechaHasta: completa.fechaHasta,
        horaDesde: completa.horaDesde.slice(0, 5),
        horaHasta: completa.horaHasta.slice(0, 5),
        precioVenta: completa.precioVenta,
        tipoPromocion: completa.tipoPromocion,
        idCategoria: categorias.find((c) => c.denominacion === completa.nombreCategoria)?.id ?? "",
        imagenUrl: completa.imagenes[0]?.url ?? null,
        detalles: completa.detalles.map((d) => ({
          idArticulo: d.idArticulo,
          nombreArticulo: d.nombreArticulo,
          tipo: "Ítem",
          precioUnitario: d.precioUnitario,
          cantidad: d.cantidad,
        })),
      });
      setModoEdicion(true);
      setPromoEditandoId(promo.id);
      setMostrarModal(true);
    } catch (error) {
      alert(`No se pudo abrir la promoción: ${mensajeDeError(error)}`);
    }
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim() || !form.descripcionDescuento.trim()) {
      setErrorGuardado("El nombre y la descripción del descuento son obligatorios.");
      return;
    }
    if (!form.fechaDesde || !form.fechaHasta || !form.horaDesde || !form.horaHasta) {
      setErrorGuardado("Las fechas y horas de vigencia son obligatorias.");
      return;
    }
    if (form.idCategoria === "") {
      setErrorGuardado("La categoría es obligatoria.");
      return;
    }
    if (form.precioVenta === "" || form.precioVenta <= 0) {
      setErrorGuardado("El precio promocional debe ser mayor a 0.");
      return;
    }
    if (form.detalles.length === 0) {
      setErrorGuardado("Agregá al menos un producto o insumo a la promoción.");
      return;
    }
    if (form.detalles.some((d) => d.cantidad === "" || d.cantidad <= 0)) {
      setErrorGuardado("Todos los ítems necesitan una cantidad mayor a 0.");
      return;
    }
    if (guardando) return;
    setErrorGuardado(null);
    setGuardando(true);
    try {
      let imagenUrl = form.imagenUrl;
      if (archivoNuevo) {
        imagenUrl = await subirImagen(archivoNuevo);
        limpiarFotoElegida();
        setForm((prev) => ({ ...prev, imagenUrl }));
      }
      const dto: PromocionRequestDto = {
        nombre: form.nombre,
        descripcionDescuento: form.descripcionDescuento,
        fechaDesde: form.fechaDesde,
        fechaHasta: form.fechaHasta,
        horaDesde: `${form.horaDesde}:00`,
        horaHasta: `${form.horaHasta}:00`,
        precioVenta: form.precioVenta,
        tipoPromocion: form.tipoPromocion,
        idCategoria: form.idCategoria,
        detalles: form.detalles.map((d) => ({
          idArticulo: d.idArticulo,
          cantidad: d.cantidad === "" ? 0 : d.cantidad,
        })),
        imagenesUrls: imagenUrl ? [imagenUrl] : [],
      };
      if (modoEdicion && promoEditandoId !== null) {
        await actualizarPromocion(promoEditandoId, dto);
      } else {
        await crearPromocion(dto);
      }
      recargar();
      setMostrarModal(false);
    } catch (error) {
      setErrorGuardado(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (promo: PromocionAdminRow) => {
    setProcesando(promo.id);
    try {
      await cambiarEstadoHabilitacionPromocion(promo.id);
      recargar();
    } catch (error) {
      alert(`No se pudo cambiar el estado: ${mensajeDeError(error)}`);
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAdmin />
      <div className="flex flex-1 overflow-auto">
        <SideBar />
        <main className="flex-1 py-10 px-10 pb-10 bg-gray-100">
          <div className="flex justify-between items-center pb-4">
            <h1 className="text-2xl font-semibold">Promociones</h1>
            <Boton
              tipo="button"
              textoBoton="Añadir"
              onClick={abrirModalAgregar}
              estiloBoton="border rounded-md py-2 px-8 font-semibold text-sm bg-[#d6aa7b] text-white hover:bg-[#c69a69] transition"
            />
          </div>

          <input
            type="text"
            placeholder="Buscar por nombre..."
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
                  <EncabezadoOrdenable campo="nombre" etiqueta="Nombre" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <EncabezadoOrdenable campo="precioVenta" etiqueta="Precio" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-4 py-3 text-left">Estado</th>
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
                {promociones.map((promo) => (
                  <tr key={promo.id} className="border-b">
                    <td className="px-4 py-2">
                      {urlDeImagen(promo.urlImagen) ? (
                        <img
                          src={urlDeImagen(promo.urlImagen)!}
                          alt={`Foto de ${promo.nombre}`}
                          onError={(e) => (e.currentTarget.style.display = "none")}
                          className="h-10 w-10 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{promo.nombre}</td>
                    <td className="px-4 py-2">{promo.descripcionDescuento}</td>
                    <td className="px-4 py-2">${promo.precioVenta}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          promo.activo ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {promo.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                        onClick={() => abrirModalEditar(promo)}
                      >
                        Editar
                      </button>
                      <button
                        disabled={procesando === promo.id}
                        className={`cursor-pointer px-3 py-2 rounded text-white disabled:opacity-60 ${
                          promo.activo ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
                        }`}
                        onClick={() => handleCambiarEstado(promo)}
                      >
                        {promo.activo ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!cargando && promociones.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-4 text-gray-500">
                      No hay promociones que coincidan con la búsqueda.
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
                {modoEdicion ? "Editar promoción" : "Nueva promoción"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-sm">Nombre *</label>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Combo Familiar"
                    className="border px-2 py-1 rounded"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-sm">Tipo *</label>
                  <select
                    value={form.tipoPromocion}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tipoPromocion: e.target.value as TipoPromocionApi }))
                    }
                    className="border px-2 py-1 rounded"
                  >
                    {Object.entries(TIPO_LABEL).map(([valor, etiqueta]) => (
                      <option key={valor} value={valor}>
                        {etiqueta}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="font-semibold text-sm">Descripción del descuento *</label>
                  <input
                    value={form.descripcionDescuento}
                    onChange={(e) => setForm((prev) => ({ ...prev, descripcionDescuento: e.target.value }))}
                    placeholder="Ej: 2 hamburguesas + 1 bebida a precio especial"
                    className="border px-2 py-1 rounded"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-sm">Vigente desde *</label>
                  <input
                    type="date"
                    value={form.fechaDesde}
                    onChange={(e) => setForm((prev) => ({ ...prev, fechaDesde: e.target.value }))}
                    className="border px-2 py-1 rounded"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-sm">Vigente hasta *</label>
                  <input
                    type="date"
                    value={form.fechaHasta}
                    onChange={(e) => setForm((prev) => ({ ...prev, fechaHasta: e.target.value }))}
                    className="border px-2 py-1 rounded"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-sm">Hora desde *</label>
                  <input
                    type="time"
                    value={form.horaDesde}
                    onChange={(e) => setForm((prev) => ({ ...prev, horaDesde: e.target.value }))}
                    className="border px-2 py-1 rounded"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-sm">Hora hasta *</label>
                  <input
                    type="time"
                    value={form.horaHasta}
                    onChange={(e) => setForm((prev) => ({ ...prev, horaHasta: e.target.value }))}
                    className="border px-2 py-1 rounded"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-sm">Categoría *</label>
                  <select
                    value={form.idCategoria}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, idCategoria: e.target.value ? Number(e.target.value) : "" }))
                    }
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
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-sm">Precio promocional *</label>
                  <InputNumerico
                    value={form.precioVenta}
                    onChange={(valor) => setForm((prev) => ({ ...prev, precioVenta: valor }))}
                    className="border px-2 py-1 rounded"
                  />
                  <span className="text-xs text-gray-500">
                    Precio de lista (suma de los ítems): ${precioDeLista.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 p-3">
                <label className="font-semibold text-sm">Productos e insumos incluidos *</label>
                <div className="relative mt-1">
                  <input
                    value={busquedaItem}
                    onChange={(e) => setBusquedaItem(e.target.value)}
                    placeholder="Buscar producto o insumo para agregar..."
                    className="border px-2 py-1 rounded w-full"
                  />
                  {busquedaItem.trim() && (
                    <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border rounded shadow">
                      {buscandoItem && <p className="text-xs text-gray-500 px-2 py-1">Buscando...</p>}
                      {!buscandoItem && resultadosItem.length === 0 && (
                        <p className="text-xs text-gray-500 px-2 py-1">Sin resultados.</p>
                      )}
                      {resultadosItem.map((item) => (
                        <button
                          type="button"
                          key={`${item.tipo}-${item.id}`}
                          onClick={() => agregarItem(item)}
                          className="cursor-pointer w-full text-left px-2 py-1 text-sm hover:bg-gray-100 flex justify-between"
                        >
                          <span>
                            {item.denominacion}{" "}
                            <span className="text-xs text-gray-400">({item.tipo})</span>
                          </span>
                          <span>${item.precioVenta}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {form.detalles.length > 0 && (
                  <table className="w-full text-sm mt-3">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="pb-1">Ítem</th>
                        <th className="pb-1">Cantidad</th>
                        <th className="pb-1 text-right">Subtotal</th>
                        <th className="pb-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.detalles.map((d) => (
                        <tr key={d.idArticulo} className="border-t">
                          <td className="py-1">
                            {d.nombreArticulo} <span className="text-xs text-gray-400">({d.tipo})</span>
                          </td>
                          <td className="py-1 w-24">
                            <InputNumerico
                              decimales={false}
                              value={d.cantidad}
                              onChange={(valor) => cambiarCantidadItem(d.idArticulo, valor)}
                              className="border px-2 py-1 rounded w-full"
                            />
                          </td>
                          <td className="py-1 text-right">
                            ${(d.precioUnitario * (d.cantidad === "" ? 0 : d.cantidad)).toLocaleString()}
                          </td>
                          <td className="py-1 text-right">
                            <button
                              type="button"
                              onClick={() => quitarItem(d.idArticulo)}
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

              <div className="mt-4">
                <label className="font-semibold text-sm">Foto</label>
                <div className="flex flex-col gap-2 mt-1">
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
              </div>

              {errorGuardado && (
                <p role="alert" className="mt-4 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2">
                  No se pudo guardar la promoción: {errorGuardado}
                </p>
              )}
              <div className="flex justify-end mt-6">
                <Boton
                  tipo="button"
                  textoBoton={
                    guardando ? "Guardando..." : modoEdicion ? "Guardar cambios" : "Crear promoción"
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

export default Promociones;
