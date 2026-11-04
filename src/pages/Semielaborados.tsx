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
import { factorDeUnidad } from "../utils/unidades";
import { subirImagen, TAMANIO_MAXIMO_IMAGEN_MB, TIPOS_IMAGEN_PERMITIDOS } from "../services/imagenService";
import { useCategoria } from "../context/CategoriaContext";
import { useAuth } from "../context/AuthContext";
import { useTablaServidor } from "../hooks/useTablaServidor";
import {
  actualizarSemielaborado,
  crearLote,
  crearSemielaborado,
  descartarLote,
  editarLote,
  eliminarLote,
  eliminarSemielaborado,
  listarLotes,
  listarSemielaboradosAdmin,
  obtenerSemielaborado,
  type EstadoLote,
  type Lote,
  type NivelStock,
  type SemielaboradoDetalle,
  type SemielaboradoFila,
  type UnidadSemielaborado,
} from "../services/semielaboradoService";

const UNIDADES: { valor: UnidadSemielaborado; etiqueta: string; abreviatura: string }[] = [
  { valor: "KG", etiqueta: "Kilos", abreviatura: "kg" },
  { valor: "L", etiqueta: "Litros", abreviatura: "l" },
  { valor: "UNIDAD", etiqueta: "Unidad", abreviatura: "un" },
];

const NIVEL: Record<NivelStock, { texto: string; color: string }> = {
  SUFICIENTE: { texto: "Stock suficiente", color: "bg-green-500" },
  ULTIMAS: { texto: "Últimas unidades", color: "bg-yellow-400" },
  AGOTADO: { texto: "Agotado o insuficiente", color: "bg-red-500" },
};

const ESTADO_LOTE: Record<EstadoLote, { texto: string; clase: string }> = {
  VIGENTE: { texto: "Vigente", clase: "bg-green-100 text-green-800" },
  AGOTADO: { texto: "Agotado", clase: "bg-gray-200 text-gray-700" },
  VENCIDO: { texto: "Vencido", clase: "bg-red-100 text-red-800" },
  DESCARTADO: { texto: "Dado de baja", clase: "bg-gray-100 text-gray-500 line-through" },
};

// Fecha LOCAL (no toISOString, que es UTC: a la noche en Argentina ya sería "mañana" y el
// backend rechaza una elaboración futura).
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmt = (n: number | null | undefined, decimales = 2) =>
  n == null ? "—" : n.toLocaleString("es-AR", { maximumFractionDigits: decimales });
const fmtFecha = (iso: string) => iso.split("-").reverse().join("/");

interface InsumoBuscado {
  id: number;
  denominacion: string;
  unidadMedida?: { abreviatura: string } | null;
}

interface IngredienteForm {
  idComponente: number;
  nombreComponente: string;
  unidad: string;
  cantidad: number | "";
}

interface FormSemi {
  denominacion: string;
  descripcion: string;
  unidadMedida: UnidadSemielaborado;
  stockMinimo: number | "";
  stockMaximo: number | "";
  idCategoria: number | "";
  imagenUrl: string | null;
  detalles: IngredienteForm[];
}

const FORM_INICIAL: FormSemi = {
  denominacion: "",
  descripcion: "",
  unidadMedida: "KG",
  stockMinimo: "",
  stockMaximo: "",
  idCategoria: "",
  imagenUrl: null,
  detalles: [],
};

interface FormLote {
  idLote: number | null;
  fechaElaboracion: string;
  cantidad: number | "";
  fechaVencimiento: string;
}

export const Semielaborados = () => {
  const { usuario } = useAuth();
  // Admin y cocinero ven y editan semielaborados; cargar, corregir, borrar o dar de baja lotes
  // es solo del admin (enunciado #23).
  const esAdmin = usuario?.rol === "ADMIN";
  const { categorias } = useCategoria();
  const categoriasInsumo = categorias.filter((c) => c.tipo === "INSUMO" && !c.categoriaPadre);

  const {
    busqueda, setBusqueda, pagina, setPagina, ordenarPor, direccion, alClickearColumna,
    datos, cargando, error, recargar,
  } = useTablaServidor<SemielaboradoFila>(listarSemielaboradosAdmin);
  const filas = datos?.contenido ?? [];

  // --- Formulario de alta/edición ---
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormSemi>(FORM_INICIAL);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [resultadosInsumo, setResultadosInsumo] = useState<InsumoBuscado[]>([]);
  const [buscandoInsumo, setBuscandoInsumo] = useState(false);
  const fotoMostrada = vistaPrevia ?? urlDeImagen(form.imagenUrl);
  const unidadForm = UNIDADES.find((u) => u.valor === form.unidadMedida)!;

  // --- Detalle con lotes ---
  const [detalle, setDetalle] = useState<SemielaboradoDetalle | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
  const [formLote, setFormLote] = useState<FormLote | null>(null);
  const [errorLote, setErrorLote] = useState<string | null>(null);
  const [guardandoLote, setGuardandoLote] = useState(false);

  useEffect(() => {
    if (!mostrarForm || !busquedaInsumo.trim()) {
      setResultadosInsumo([]);
      return;
    }
    let cancelado = false;
    setBuscandoInsumo(true);
    const timeout = setTimeout(async () => {
      try {
        const r = await apiFetchJson<{ contenido: InsumoBuscado[] }>(
          `/insumos/all?busqueda=${encodeURIComponent(busquedaInsumo)}&page=0&size=8`
        );
        if (!cancelado) setResultadosInsumo(r.contenido);
      } catch {
        if (!cancelado) setResultadosInsumo([]);
      } finally {
        if (!cancelado) setBuscandoInsumo(false);
      }
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(timeout);
    };
  }, [busquedaInsumo, mostrarForm]);

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
      setErrorForm("La foto debe ser una imagen JPG, PNG o WEBP.");
      return;
    }
    if (archivo.size > TAMANIO_MAXIMO_IMAGEN_MB * 1024 * 1024) {
      setErrorForm(`La foto supera el máximo de ${TAMANIO_MAXIMO_IMAGEN_MB} MB.`);
      return;
    }
    setErrorForm(null);
    limpiarFotoElegida();
    setArchivoNuevo(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
  };

  const abrirAlta = () => {
    limpiarFotoElegida();
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setErrorForm(null);
    setBusquedaInsumo("");
    setMostrarForm(true);
  };

  const abrirEdicion = async (id: number) => {
    try {
      const s = await obtenerSemielaborado(id);
      limpiarFotoElegida();
      setForm({
        denominacion: s.denominacion,
        descripcion: s.descripcion ?? "",
        unidadMedida: (UNIDADES.find((u) => u.etiqueta === s.unidadMedida)?.valor ?? "KG"),
        stockMinimo: s.stockMinimo,
        stockMaximo: s.stockMaximo,
        idCategoria: s.categoria?.id ?? "",
        imagenUrl: s.imagenes?.[0]?.url ?? null,
        detalles: s.detalles.map((d) => ({
          idComponente: d.idComponente,
          nombreComponente: d.nombreComponente,
          unidad: d.unidadComponente ?? "",
          cantidad: d.cantidad,
        })),
      });
      setEditandoId(id);
      setErrorForm(null);
      setBusquedaInsumo("");
      setMostrarForm(true);
    } catch (e) {
      alert(`No se pudo abrir el semielaborado: ${mensajeDeError(e)}`);
    }
  };

  const agregarIngrediente = (item: InsumoBuscado) => {
    setForm((prev) =>
      prev.detalles.some((d) => d.idComponente === item.id)
        ? prev
        : {
            ...prev,
            detalles: [
              ...prev.detalles,
              { idComponente: item.id, nombreComponente: item.denominacion, unidad: item.unidadMedida?.abreviatura ?? "", cantidad: "" },
            ],
          }
    );
    setBusquedaInsumo("");
    setResultadosInsumo([]);
  };

  const guardar = async () => {
    const categoria = categoriasInsumo.find((c) => c.id === form.idCategoria);
    if (!form.denominacion.trim() || !form.descripcion.trim() || !categoria) {
      setErrorForm("Denominación, descripción y categoría son obligatorias.");
      return;
    }
    if (form.stockMinimo === "" || form.stockMaximo === "") {
      setErrorForm("El stock mínimo y el máximo son obligatorios.");
      return;
    }
    if (form.stockMinimo > form.stockMaximo) {
      setErrorForm("El stock mínimo no puede ser mayor que el máximo.");
      return;
    }
    if (form.detalles.length === 0) {
      setErrorForm("Agregá al menos un insumo a la receta (si no, no se sabe qué descontar al preparar un lote).");
      return;
    }
    if (form.detalles.some((d) => d.cantidad === "" || d.cantidad <= 0)) {
      setErrorForm("Todos los insumos de la receta necesitan una cantidad mayor a 0.");
      return;
    }
    if (guardando) return;
    setGuardando(true);
    setErrorForm(null);
    try {
      let imagenUrl = form.imagenUrl;
      if (archivoNuevo) {
        imagenUrl = await subirImagen(archivoNuevo);
        limpiarFotoElegida();
        setForm((prev) => ({ ...prev, imagenUrl }));
      }
      const datosReq = {
        denominacion: form.denominacion.trim(),
        descripcion: form.descripcion.trim(),
        unidadMedida: form.unidadMedida,
        stockMinimo: form.stockMinimo,
        stockMaximo: form.stockMaximo,
        idCategoria: categoria.id!,
        categoriaDenominacion: categoria.denominacion,
        imagenUrl,
        detalles: form.detalles.map((d) => ({ idComponente: d.idComponente, cantidad: d.cantidad as number })),
      };
      if (editandoId !== null) await actualizarSemielaborado(editandoId, datosReq);
      else await crearSemielaborado(datosReq);
      setMostrarForm(false);
      recargar();
    } catch (e) {
      setErrorForm(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (fila: SemielaboradoFila) => {
    if (!window.confirm(`¿Eliminar el semielaborado "${fila.denominacion}"? No se puede deshacer.`)) return;
    try {
      await eliminarSemielaborado(fila.id);
      recargar();
    } catch (e) {
      alert(`No se pudo eliminar: ${mensajeDeError(e)}`);
    }
  };

  // --- Detalle y lotes ---
  const abrirDetalle = async (id: number) => {
    try {
      const [s, l] = await Promise.all([obtenerSemielaborado(id), listarLotes(id)]);
      setDetalle(s);
      setLotes(l);
      setErrorDetalle(null);
    } catch (e) {
      alert(`No se pudo abrir el detalle: ${mensajeDeError(e)}`);
    }
  };

  const refrescarDetalle = async () => {
    if (!detalle) return;
    await abrirDetalle(detalle.id);
    recargar();
  };

  const abrirLoteNuevo = () => {
    setErrorLote(null);
    setFormLote({ idLote: null, fechaElaboracion: hoyISO(), cantidad: "", fechaVencimiento: "" });
  };

  const abrirLoteEdicion = (lote: Lote) => {
    setErrorLote(null);
    setFormLote({
      idLote: lote.id,
      fechaElaboracion: lote.fechaElaboracion,
      cantidad: lote.cantidad,
      fechaVencimiento: lote.fechaVencimiento,
    });
  };

  const guardarLote = async () => {
    if (!detalle || !formLote) return;
    if (formLote.cantidad === "" || formLote.cantidad <= 0) {
      setErrorLote("La cantidad debe ser mayor a 0.");
      return;
    }
    if (!formLote.fechaVencimiento) {
      setErrorLote("La fecha de vencimiento es obligatoria.");
      return;
    }
    if (guardandoLote) return;
    setGuardandoLote(true);
    setErrorLote(null);
    try {
      const datosLote = {
        fechaElaboracion: formLote.fechaElaboracion || null,
        cantidad: formLote.cantidad,
        fechaVencimiento: formLote.fechaVencimiento,
      };
      if (formLote.idLote !== null) await editarLote(formLote.idLote, datosLote);
      else await crearLote(detalle.id, datosLote);
      setFormLote(null);
      await refrescarDetalle();
    } catch (e) {
      setErrorLote(mensajeDeError(e));
    } finally {
      setGuardandoLote(false);
    }
  };

  const borrarLote = async (lote: Lote) => {
    if (!window.confirm(`¿Borrar el lote del ${fmtFecha(lote.fechaElaboracion)}? Los insumos que se usaron para prepararlo vuelven al stock.`)) return;
    try {
      await eliminarLote(lote.id);
      await refrescarDetalle();
    } catch (e) {
      setErrorDetalle(mensajeDeError(e));
    }
  };

  const darDeBajaLote = async (lote: Lote) => {
    if (!window.confirm(`¿Dar de baja el lote vencido del ${fmtFecha(lote.fechaElaboracion)}? Se considera tirado: los insumos no vuelven.`)) return;
    try {
      await descartarLote(lote.id);
      await refrescarDetalle();
    } catch (e) {
      setErrorDetalle(mensajeDeError(e));
    }
  };

  // Vista previa de lo que se va a descontar (o devolver) de cada insumo al guardar el lote.
  const previsualizacionLote = (() => {
    if (!detalle || !formLote || formLote.cantidad === "" || formLote.cantidad <= 0) return null;
    const anterior = formLote.idLote !== null ? lotes.find((l) => l.id === formLote.idLote)?.cantidad ?? 0 : 0;
    const diferencia = formLote.cantidad - anterior;
    if (diferencia === 0) return null;
    return {
      devuelve: diferencia < 0,
      items: detalle.detalles.map((d) => ({
        nombre: d.nombreComponente,
        cantidad: d.cantidad * Math.abs(diferencia),
        unidad: d.unidadComponente ?? "",
      })),
    };
  })();

  const costoLinea = (d: SemielaboradoDetalle["detalles"][number]) => {
    const factor = factorDeUnidad(d.unidadComponente);
    if (d.costoUnitarioComponente == null || factor == null) return null;
    return d.cantidad * factor * d.costoUnitarioComponente;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAdmin />
      <div className="flex flex-1 overflow-auto">
        <SideBar />
        <main className="flex-1 py-10 px-10 pb-10 bg-gray-100">
          <div className="flex justify-between items-center pb-4">
            <div>
              <h1 className="text-2xl font-semibold">Semielaborados</h1>
              <p className="text-sm text-gray-600">
                Preparaciones propias que se usan como ingrediente (ej. masa de pizza). Su stock es la suma de sus lotes.
              </p>
            </div>
            <Boton
              tipo="button"
              textoBoton="Añadir"
              onClick={abrirAlta}
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
                  <EncabezadoOrdenable campo="precioCosto" etiqueta="Costo" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
                  <th className="px-4 py-3 text-left">Stock (actual / mín / máx)</th>
                  <th className="px-4 py-3 text-left">Disponibilidad</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando && (
                  <tr><td colSpan={6} className="text-center p-4 text-gray-500">Cargando...</td></tr>
                )}
                {filas.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="px-4 py-2">
                      {urlDeImagen(s.imagenUrl) ? (
                        <img src={urlDeImagen(s.imagenUrl)!} alt={`Foto de ${s.denominacion}`} className="h-10 w-10 object-cover rounded" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{s.denominacion}</td>
                    <td className="px-4 py-2">${fmt(s.precioCosto)} / {s.unidadAbreviatura}</td>
                    <td className="px-4 py-2">
                      {fmt(s.stockActual, 3)} / {fmt(s.stockMinimo, 3)} / {fmt(s.stockMaximo, 3)} {s.unidadAbreviatura}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${NIVEL[s.nivelStock].color}`} aria-hidden />
                        {NIVEL[s.nivelStock].texto}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-2 flex-wrap">
                      <button className="cursor-pointer bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded" onClick={() => abrirDetalle(s.id)}>
                        Ver detalle y lotes
                      </button>
                      <button className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded" onClick={() => abrirEdicion(s.id)}>
                        Editar
                      </button>
                      {esAdmin && (
                        <button className="cursor-pointer bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded" onClick={() => eliminar(s)}>
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!cargando && filas.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-4 text-gray-500">No hay semielaborados que coincidan con la búsqueda.</td></tr>
                )}
              </tbody>
            </table>
            {datos && (
              <Paginador pagina={pagina} totalPaginas={datos.totalPaginas} totalElementos={datos.totalElementos} tamanio={datos.tamanio} onCambiarPagina={setPagina} />
            )}
          </div>

          {/* ---------- Alta / edición ---------- */}
          <Modal isOpen={mostrarForm} onClose={() => setMostrarForm(false)} className="max-w-2xl w-full">
            <div className="p-2">
              <h2 className="text-xl font-semibold mb-4">{editandoId !== null ? "Editar semielaborado" : "Nuevo semielaborado"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="font-semibold" htmlFor="semi-denominacion">Denominación *</label>
                <input id="semi-denominacion" value={form.denominacion} onChange={(e) => setForm({ ...form, denominacion: e.target.value })} placeholder="Ej: Masa de pizza" className="border px-2 py-1 rounded" />
                <label className="font-semibold" htmlFor="semi-descripcion">Descripción *</label>
                <input id="semi-descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Masa base para pizzas" className="border px-2 py-1 rounded" />
                <label className="font-semibold" htmlFor="semi-unidad">Unidad de medida *</label>
                <select id="semi-unidad" value={form.unidadMedida} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value as UnidadSemielaborado })} className="border px-2 py-1 rounded">
                  {UNIDADES.map((u) => <option key={u.valor} value={u.valor}>{u.etiqueta}</option>)}
                </select>
                <label className="font-semibold">Stock mínimo * ({unidadForm.abreviatura})</label>
                <InputNumerico value={form.stockMinimo} onChange={(v) => setForm({ ...form, stockMinimo: v })} className="border px-2 py-1 rounded" />
                <label className="font-semibold">Stock máximo * ({unidadForm.abreviatura})</label>
                <InputNumerico value={form.stockMaximo} onChange={(v) => setForm({ ...form, stockMaximo: v })} className="border px-2 py-1 rounded" />
                <label className="font-semibold" htmlFor="semi-categoria">Categoría *</label>
                <select id="semi-categoria" value={form.idCategoria} onChange={(e) => setForm({ ...form, idCategoria: e.target.value === "" ? "" : Number(e.target.value) })} className="border px-2 py-1 rounded">
                  <option value="">Seleccione una categoría</option>
                  {categoriasInsumo.map((c) => <option key={c.id} value={c.id}>{c.denominacion}</option>)}
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                El stock actual no se carga acá: se suma con "Añadir existencia" en el detalle, cada vez que se prepara un lote.
              </p>

              <div className="mt-4 rounded-lg border border-gray-200 p-3">
                <label className="font-semibold text-sm">Receta para 1 {unidadForm.etiqueta === "Unidad" ? "unidad" : unidadForm.abreviatura} *</label>
                <p className="text-xs text-gray-500 mb-1">
                  Solo insumos. Al preparar un lote se descuentan de su stock (receta × cantidad del lote).
                </p>
                <div className="relative mt-1">
                  <input value={busquedaInsumo} onChange={(e) => setBusquedaInsumo(e.target.value)} placeholder="Buscar insumo para agregar..." className="border px-2 py-1 rounded w-full" />
                  {busquedaInsumo.trim() && (
                    <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border rounded shadow">
                      {buscandoInsumo && <p className="text-xs text-gray-500 px-2 py-1">Buscando...</p>}
                      {!buscandoInsumo && resultadosInsumo.length === 0 && <p className="text-xs text-gray-500 px-2 py-1">Sin resultados.</p>}
                      {resultadosInsumo.map((i) => (
                        <button type="button" key={i.id} onClick={() => agregarIngrediente(i)} className="cursor-pointer w-full text-left px-2 py-1 text-sm hover:bg-gray-100">
                          {i.denominacion} <span className="text-xs text-gray-400">({i.unidadMedida?.abreviatura})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {form.detalles.length > 0 && (
                  <table className="w-full text-sm mt-3">
                    <thead><tr className="text-left text-gray-500"><th className="pb-1">Insumo</th><th className="pb-1">Cantidad</th><th /></tr></thead>
                    <tbody>
                      {form.detalles.map((d) => (
                        <tr key={d.idComponente} className="border-t">
                          <td className="py-1">{d.nombreComponente}</td>
                          <td className="py-1 w-40">
                            <div className="flex items-center gap-1">
                              <InputNumerico
                                value={d.cantidad}
                                onChange={(v) => setForm((prev) => ({ ...prev, detalles: prev.detalles.map((x) => x.idComponente === d.idComponente ? { ...x, cantidad: v } : x) }))}
                                className="border px-2 py-1 rounded w-full"
                              />
                              <span className="text-xs text-gray-500">{d.unidad}</span>
                            </div>
                          </td>
                          <td className="py-1 text-right">
                            <button type="button" onClick={() => setForm((prev) => ({ ...prev, detalles: prev.detalles.filter((x) => x.idComponente !== d.idComponente) }))} className="cursor-pointer text-red-500 hover:text-red-700 text-xs">
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <span className="font-semibold">Foto</span>
                {fotoMostrada && <img src={fotoMostrada} alt="Vista previa de la foto" className="h-32 w-full max-w-xs object-cover rounded border" />}
                <div className="flex gap-2">
                  <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded">
                    {fotoMostrada ? "Cambiar foto" : "Elegir foto"}
                    <input type="file" accept={TIPOS_IMAGEN_PERMITIDOS.join(",")} className="hidden" onChange={handleElegirFoto} />
                  </label>
                  {fotoMostrada && (
                    <button type="button" onClick={() => { limpiarFotoElegida(); setForm((p) => ({ ...p, imagenUrl: null })); }} className="cursor-pointer bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded">
                      Quitar foto
                    </button>
                  )}
                </div>
              </div>

              {errorForm && (
                <p role="alert" className="mt-4 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2">
                  No se pudo guardar: {errorForm}
                </p>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setMostrarForm(false)} className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">Cancelar</button>
                <Boton tipo="button" textoBoton={guardando ? "Guardando..." : editandoId !== null ? "Guardar cambios" : "Crear semielaborado"} onClick={guardar} estiloBoton="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" />
              </div>
            </div>
          </Modal>

          {/* ---------- Detalle con lotes ---------- */}
          <Modal isOpen={detalle !== null} onClose={() => setDetalle(null)} className="max-w-4xl w-full">
            {detalle && (
              <div className="p-2">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{detalle.denominacion}</h2>
                    <p className="text-sm text-gray-600">{detalle.descripcion} · {detalle.categoria?.nombre ?? detalle.categoria?.denominacion}</p>
                  </div>
                  <button type="button" onClick={() => { const id = detalle.id; setDetalle(null); abrirEdicion(id); }} className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm">
                    Editar
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    ["Costo", `$${fmt(detalle.precioCosto)} / ${detalle.unidadAbreviatura}`],
                    ["Stock actual", `${fmt(detalle.stockActual, 3)} ${detalle.unidadAbreviatura}`],
                    ["Stock mínimo", `${fmt(detalle.stockMinimo, 3)} ${detalle.unidadAbreviatura}`],
                    ["Stock máximo", `${fmt(detalle.stockMaximo, 3)} ${detalle.unidadAbreviatura}`],
                  ].map(([titulo, valor]) => (
                    <div key={titulo} className="rounded-lg border border-gray-200 p-3 text-center">
                      <p className="text-xs text-gray-500">{titulo}</p>
                      <p className="font-semibold">{valor}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Existencias (lotes)</h3>
                  <button
                    type="button"
                    onClick={abrirLoteNuevo}
                    disabled={!esAdmin}
                    title={esAdmin ? undefined : "Solo el administrador puede cargar existencias"}
                    className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Añadir existencia
                  </button>
                </div>
                {errorDetalle && (
                  <p role="alert" className="mb-2 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2">{errorDetalle}</p>
                )}
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                      <tr>
                        <th className="px-2 py-2">Elaboración</th>
                        <th className="px-2 py-2">Vencimiento</th>
                        <th className="px-2 py-2">Cantidad</th>
                        <th className="px-2 py-2">Queda</th>
                        <th className="px-2 py-2">Costo x {detalle.unidadAbreviatura}</th>
                        <th className="px-2 py-2">Costo total</th>
                        <th className="px-2 py-2">Estado</th>
                        <th className="px-2 py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotes.length === 0 && (
                        <tr><td colSpan={8} className="text-center text-gray-500 py-3">Todavía no se cargó ningún lote.</td></tr>
                      )}
                      {lotes.map((l) => (
                        <tr key={l.id} className="border-t">
                          <td className="px-2 py-2">{fmtFecha(l.fechaElaboracion)}</td>
                          <td className="px-2 py-2">{fmtFecha(l.fechaVencimiento)}</td>
                          <td className="px-2 py-2">{fmt(l.cantidad, 3)} {detalle.unidadAbreviatura}</td>
                          <td className="px-2 py-2">{fmt(l.cantidadRestante, 3)} {detalle.unidadAbreviatura}</td>
                          <td className="px-2 py-2">${fmt(l.costoUnitario)}</td>
                          <td className="px-2 py-2">${fmt(l.costoTotal)}</td>
                          <td className="px-2 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ESTADO_LOTE[l.estado].clase}`}>{ESTADO_LOTE[l.estado].texto}</span>
                          </td>
                          <td className="px-2 py-2 flex gap-2">
                            {esAdmin && l.editable && l.estado !== "VENCIDO" && (
                              <>
                                <button type="button" onClick={() => abrirLoteEdicion(l)} className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs">Corregir</button>
                                <button type="button" onClick={() => borrarLote(l)} className="cursor-pointer bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">Borrar</button>
                              </>
                            )}
                            {esAdmin && l.estado === "VENCIDO" && (
                              <button type="button" onClick={() => darDeBajaLote(l)} className="cursor-pointer bg-gray-700 hover:bg-gray-800 text-white px-2 py-1 rounded text-xs">Dar de baja</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-semibold mb-2">Receta (para 1 {detalle.unidadAbreviatura})</h3>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-left">
                    <tr><th className="px-2 py-2">Cantidad</th><th className="px-2 py-2">Insumo</th><th className="px-2 py-2">Costo unit.</th><th className="px-2 py-2">Costo total</th></tr>
                  </thead>
                  <tbody>
                    {detalle.detalles.map((d) => (
                      <tr key={d.idComponente} className="border-t">
                        <td className="px-2 py-2">{fmt(d.cantidad, 3)} {d.unidadComponente}</td>
                        <td className="px-2 py-2">{d.nombreComponente}</td>
                        <td className="px-2 py-2">${fmt(d.costoUnitarioComponente)} x {d.unidadComponente === "gr" ? "kg" : d.unidadComponente === "ml" ? "l" : d.unidadComponente}</td>
                        <td className="px-2 py-2">${fmt(costoLinea(d))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Modal>

          {/* ---------- Alta / corrección de lote ---------- */}
          <Modal isOpen={formLote !== null} onClose={() => setFormLote(null)} className="max-w-lg w-full">
            {formLote && detalle && (
              <div className="p-2">
                <h2 className="text-xl font-semibold mb-1">{formLote.idLote !== null ? "Corregir existencia" : "Añadir existencia"}</h2>
                <p className="text-sm text-gray-600 mb-4">{detalle.denominacion}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="font-semibold" htmlFor="lote-elaboracion">Fecha de elaboración *</label>
                  <input id="lote-elaboracion" type="date" value={formLote.fechaElaboracion} max={hoyISO()} disabled={formLote.idLote !== null} onChange={(e) => setFormLote({ ...formLote, fechaElaboracion: e.target.value })} className="border px-2 py-1 rounded disabled:bg-gray-100" />
                  <label className="font-semibold">Cantidad * ({detalle.unidadAbreviatura})</label>
                  <InputNumerico value={formLote.cantidad} onChange={(v) => setFormLote({ ...formLote, cantidad: v })} className="border px-2 py-1 rounded" />
                  <label className="font-semibold" htmlFor="lote-vencimiento">Vencimiento *</label>
                  <input id="lote-vencimiento" type="date" value={formLote.fechaVencimiento} min={formLote.fechaElaboracion} onChange={(e) => setFormLote({ ...formLote, fechaVencimiento: e.target.value })} className="border px-2 py-1 rounded" />
                </div>
                {previsualizacionLote && (
                  <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm">
                    <p className="font-semibold mb-1">{previsualizacionLote.devuelve ? "Vuelven al stock de insumos:" : "Se van a descontar de los insumos:"}</p>
                    <ul className="list-disc ml-5">
                      {previsualizacionLote.items.map((i) => (
                        <li key={i.nombre}>{i.nombre}: {fmt(i.cantidad, 3)} {i.unidad}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {errorLote && (
                  <p role="alert" className="mt-4 rounded-md bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2">{errorLote}</p>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setFormLote(null)} className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded">Cancelar</button>
                  <button type="button" onClick={guardarLote} disabled={guardandoLote} className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-60">
                    {guardandoLote ? "Guardando..." : formLote.idLote !== null ? "Guardar corrección" : "Guardar existencia"}
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

export default Semielaborados;
