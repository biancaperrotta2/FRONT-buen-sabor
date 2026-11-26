import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdDeleteOutline, MdEdit } from "react-icons/md";
import { mensajeDeError } from "../api/client";
import {
  crearExistenciaInsumo,
  editarExistenciaInsumo,
  eliminarExistenciaInsumo,
  listarExistenciasInsumo,
  obtenerInsumoDetalle,
  type ExistenciaInsumo,
} from "../services/detalleArticuloService";
import { InputNumerico } from "./InputNumerico";
import { urlDeImagen } from "../utils/imagen";
import { unidadBase } from "../utils/unidades";

// Lo mínimo del insumo que necesitan la tabla y el formulario.
export interface InsumoParaExistencia {
  id: number;
  denominacion: string;
  imagenUrl: string | null;
  unidad: string; // abreviatura de la unidad elegida (ej. "gr")
  unidadBase: string; // en la que se expresa el costo (ej. "kg")
}

const POR_PAGINA = 5;

// Fecha LOCAL (toISOString es UTC: a la noche en Argentina ya sería "mañana" y el backend
// rechaza una compra futura).
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fecha = (iso: string) => iso.split("-").reverse().join("/");
const numero = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 3 });
const pesos = (n: number) => `$${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;

// ---------- Sección "Existencias" del detalle de insumo (figura 66) ----------

export const SeccionExistenciasInsumo = ({
  insumo,
  onCambio,
}: {
  insumo: InsumoParaExistencia;
  // El stock y el precio de costo del insumo cambian: el detalle y la tabla se recargan.
  onCambio: () => void;
}) => {
  const [filas, setFilas] = useState<ExistenciaInsumo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const [enFormulario, setEnFormulario] = useState<ExistenciaInsumo | "nueva" | null>(null);
  const [aBorrar, setABorrar] = useState<ExistenciaInsumo | null>(null);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);

  const cargar = () =>
    listarExistenciasInsumo(insumo.id)
      .then((lista) => {
        setFilas(lista);
        setError(null);
      })
      .catch((e) => setError(mensajeDeError(e)));

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insumo.id]);

  const totalPaginas = Math.max(1, Math.ceil((filas?.length ?? 0) / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas - 1);
  const visibles = (filas ?? []).slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);

  const trasCambio = () => {
    cargar();
    onCambio();
  };

  const confirmarBorrado = async () => {
    if (!aBorrar) return;
    setBorrando(true);
    setErrorBorrado(null);
    try {
      await eliminarExistenciaInsumo(aBorrar.id);
      setABorrar(null);
      trasCambio();
    } catch (e) {
      setErrorBorrado(mensajeDeError(e));
    } finally {
      setBorrando(false);
    }
  };

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-2xl text-gray-700">Existencias</h3>
        <button
          onClick={() => setEnFormulario("nueva")}
          className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2 rounded-full"
        >
          Añadir existencia
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!filas && !error && <p className="text-sm text-gray-500">Cargando...</p>}
      {filas && filas.length === 0 && (
        <p className="text-sm text-gray-600 border border-gray-300 rounded-lg p-3">
          Todavía no hay compras cargadas. Con "Añadir existencia" registrás una y se suma al stock actual.
        </p>
      )}
      {filas && filas.length > 0 && (
        <div className="border border-gray-300 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-500 text-white text-xs text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Id</th>
                  <th className="px-3 py-2 font-semibold whitespace-nowrap">Fecha compra</th>
                  <th className="px-3 py-2 font-semibold">Cantidad</th>
                  <th className="px-3 py-2 font-semibold whitespace-nowrap">Costo x {insumo.unidadBase}</th>
                  <th className="px-3 py-2 font-semibold whitespace-nowrap">Costo total</th>
                  <th className="px-3 py-2 font-semibold">Vencimiento</th>
                  <th className="px-3 py-2 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((e) => (
                  <tr key={e.id} className="border-t border-gray-200 text-gray-700">
                    <td className="px-3 py-2">{e.id}</td>
                    <td className="px-3 py-2">{fecha(e.fechaCompra)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {numero(e.cantidad)} {insumo.unidad}
                    </td>
                    <td className="px-3 py-2">{pesos(e.costoUnitario)}</td>
                    <td className="px-3 py-2">{pesos(e.costoTotal)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fecha(e.fechaVencimiento)}
                      {e.vencida && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 rounded-full px-2 py-0.5">Vencida</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEnFormulario(e)}
                          className="flex items-center gap-1 text-xs border border-gray-400 rounded px-2 py-1 hover:bg-gray-100"
                        >
                          <MdEdit aria-hidden="true" /> Editar
                        </button>
                        <button
                          onClick={() => {
                            setErrorBorrado(null);
                            setABorrar(e);
                          }}
                          className="flex items-center gap-1 text-xs border border-red-400 text-red-700 rounded px-2 py-1 hover:bg-red-50"
                        >
                          <MdDeleteOutline aria-hidden="true" /> Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-3 py-2 text-xs text-gray-600">
            <span>
              {paginaActual * POR_PAGINA + 1}–{Math.min((paginaActual + 1) * POR_PAGINA, filas.length)} de {filas.length}
            </span>
            <button
              onClick={() => setPagina(paginaActual - 1)}
              disabled={paginaActual === 0}
              className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
              aria-label="Página anterior"
            >
              ‹
            </button>
            <button
              onClick={() => setPagina(paginaActual + 1)}
              disabled={paginaActual >= totalPaginas - 1}
              className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
              aria-label="Página siguiente"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {enFormulario && (
        <FormularioExistenciaInsumo
          insumo={insumo}
          existencia={enFormulario === "nueva" ? null : enFormulario}
          onClose={() => setEnFormulario(null)}
          onGuardado={() => {
            setEnFormulario(null);
            trasCambio();
          }}
        />
      )}

      {aBorrar &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000] px-4">
            <div role="alertdialog" aria-modal="true" className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-black">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">¿Borrar esta existencia?</h2>
              <p className="text-sm text-gray-600">
                Compra del {fecha(aBorrar.fechaCompra)} por {numero(aBorrar.cantidad)} {insumo.unidad}. Se descuenta esa
                cantidad del stock actual de {insumo.denominacion}.
              </p>
              {errorBorrado && (
                <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 mt-3">
                  {errorBorrado}
                </p>
              )}
              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={() => setABorrar(null)}
                  className="border border-gray-400 rounded-full px-5 py-2 text-sm hover:bg-gray-100"
                >
                  No
                </button>
                <button
                  onClick={confirmarBorrado}
                  disabled={borrando}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {borrando ? "Borrando..." : "Sí"}
                </button>
              </div>
            </div>
          </div>,
          document.getElementById("modal-root")!
        )}
    </section>
  );
};

// ---------- "Añadir existencia" desde la fila de la tabla de Insumos ----------
// La fila no trae la abreviatura de la unidad: se pide el detalle y después se abre el formulario.

export const AnadirExistenciaDesdeFila = ({
  idInsumo,
  onClose,
  onGuardado,
}: {
  idInsumo: number;
  onClose: () => void;
  onGuardado: () => void;
}) => {
  const [insumo, setInsumo] = useState<InsumoParaExistencia | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerInsumoDetalle(idInsumo)
      .then((i) => {
        const unidad = i.unidadMedida?.abreviatura ?? "";
        setInsumo({ id: i.id, denominacion: i.denominacion, imagenUrl: i.imagenUrl, unidad, unidadBase: unidadBase(unidad) });
      })
      .catch((e) => setError(mensajeDeError(e)));
  }, [idInsumo]);

  if (insumo) return <FormularioExistenciaInsumo insumo={insumo} existencia={null} onClose={onClose} onGuardado={onGuardado} />;
  if (!error) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000] px-4">
      <div role="alertdialog" aria-modal="true" className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 text-black">
        <p className="text-sm text-red-700">{error}</p>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="border border-gray-400 rounded-full px-5 py-2 text-sm hover:bg-gray-100">
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

// ---------- Diálogo "Añadir existencia" / "Editar existencia" (figura 67) ----------

export const FormularioExistenciaInsumo = ({
  insumo,
  existencia,
  onClose,
  onGuardado,
}: {
  insumo: InsumoParaExistencia;
  existencia: ExistenciaInsumo | null;
  onClose: () => void;
  onGuardado: () => void;
}) => {
  const [fechaCompra, setFechaCompra] = useState(existencia?.fechaCompra ?? hoyISO());
  const [cantidad, setCantidad] = useState<number | "">(existencia?.cantidad ?? "");
  const [costo, setCosto] = useState<number | "">(existencia?.costoUnitario ?? "");
  const [vencimiento, setVencimiento] = useState(existencia?.fechaVencimiento ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const url = urlDeImagen(insumo.imagenUrl);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaCompra || cantidad === "" || cantidad <= 0 || costo === "" || costo <= 0 || !vencimiento) {
      setError("Completá la fecha, una cantidad y un costo mayores a 0, y el vencimiento.");
      return;
    }
    if (fechaCompra > hoyISO()) {
      setError("La fecha de compra no puede ser futura.");
      return;
    }
    if (vencimiento < fechaCompra) {
      setError("El vencimiento no puede ser anterior a la fecha de compra.");
      return;
    }
    const datos = { fechaCompra, cantidad, costoUnitario: costo, fechaVencimiento: vencimiento };
    setGuardando(true);
    setError(null);
    try {
      if (existencia) await editarExistenciaInsumo(existencia.id, datos);
      else await crearExistenciaInsumo(insumo.id, datos);
      onGuardado();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const campo = "w-full border-b border-gray-400 focus:border-gray-700 outline-none py-1 text-sm bg-transparent";
  const etiqueta = "block text-xs text-gray-500";

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[10000] px-4 py-6">
      <form
        onSubmit={guardar}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-existencia-insumo"
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-full overflow-y-auto text-black"
      >
        <div className="flex items-center justify-between bg-gray-200 rounded-t-xl px-6 py-4">
          <h2 id="titulo-existencia-insumo" className="text-xl text-gray-700">
            {existencia ? "Editar existencia" : "Añadir existencia"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-gray-600 hover:text-black">
            <MdClose className="text-2xl" />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-5">
            {url ? (
              <img src={url} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-14 h-14 rounded-full bg-gray-300 shrink-0" aria-hidden="true" />
            )}
            <div>
              <p className="text-xs text-gray-500">Cod. {insumo.id}</p>
              <p className="text-2xl text-gray-800">{insumo.denominacion}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <label>
              <span className={etiqueta}>Fecha*</span>
              <input type="date" value={fechaCompra} max={hoyISO()} onChange={(e) => setFechaCompra(e.target.value)} className={campo} />
            </label>
            <label>
              <span className={etiqueta}>Cantidad* ({insumo.unidad})</span>
              <InputNumerico value={cantidad} onChange={setCantidad} className={campo} />
            </label>
            <label>
              <span className={etiqueta}>Costo unitario* ($ x {insumo.unidadBase})</span>
              <InputNumerico value={costo} onChange={setCosto} className={campo} />
            </label>
            <label>
              <span className={etiqueta}>Vencimiento*</span>
              <input type="date" value={vencimiento} min={fechaCompra} onChange={(e) => setVencimiento(e.target.value)} className={campo} />
            </label>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            {existencia
              ? "Al guardar, el stock actual se ajusta por la diferencia de cantidad."
              : "Al guardar, la cantidad se suma al stock actual."}{" "}
            Si es la compra más reciente, su costo pasa a ser el precio de costo del insumo.
          </p>

          {error && (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 mt-3">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={onClose} className="border border-gray-400 rounded-full px-5 py-2 text-sm hover:bg-gray-100">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="bg-gray-600 hover:bg-gray-700 text-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.getElementById("modal-root")!
  );
};
