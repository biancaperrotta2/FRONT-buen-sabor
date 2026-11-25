import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import { ApiError } from "../api/client";
import {
  obtenerInsumoDetalle,
  obtenerProductoDetalle,
  type InsumoDetalle,
  type ProductoDetalle,
} from "../services/detalleArticuloService";
import { factorDeUnidad } from "../utils/unidades";
import { urlDeImagen } from "../utils/imagen";

const pesos = (monto: number | null | undefined) =>
  monto == null ? "—" : `$${monto.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;

const fechaHora = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Sin registro";

// "gr" -> "kg", "ml" -> "l": el costo de un insumo se guarda por unidad base.
const unidadBase = (unidad: string | null) => {
  const u = (unidad ?? "").toLowerCase();
  if (u === "gr" || u === "g" || u.startsWith("gramo")) return "kg";
  if (u === "ml" || u.startsWith("mililitro")) return "l";
  return unidad ?? "";
};

const ESTADO_STOCK = {
  SUFICIENTE: { texto: "Stock suficiente", color: "bg-green-500" },
  ULTIMAS: { texto: "Últimas unidades", color: "bg-amber-500" },
  AGOTADO: { texto: "Agotado", color: "bg-red-500" },
} as const;

// ---------- piezas comunes (encabezado con foto y tarjetas de la figura) ----------

const Marco = ({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) =>
  createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-4 py-6">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-full flex flex-col text-black"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalle-articulo"
      >
        <div className="flex items-center justify-between bg-gray-200 rounded-t-xl px-6 py-4">
          <h2 id="titulo-detalle-articulo" className="text-xl text-gray-700">
            {titulo}
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-gray-600 hover:text-black">
            <MdClose className="text-2xl" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );

const Encabezado = ({
  id,
  nombre,
  imagen,
  etiquetas,
  estado,
  textoEditar,
  onEditar,
}: {
  id: number;
  nombre: string;
  imagen: string | null;
  etiquetas: string[];
  estado: { texto: string; color: string } | null;
  textoEditar: string;
  onEditar: () => void;
}) => {
  const url = urlDeImagen(imagen);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
      {url ? (
        <img src={url} alt="" className="w-20 h-20 rounded-full object-cover shrink-0" />
      ) : (
        <span className="w-20 h-20 rounded-full bg-gray-300 shrink-0" aria-hidden="true" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">Cod. {id}</p>
        <p className="text-2xl text-gray-800 truncate">{nombre}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {etiquetas.map((e) => (
            <span key={e} className="border border-gray-400 rounded-full px-3 py-0.5 text-xs text-gray-600">
              {e}
            </span>
          ))}
          {estado && (
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <span className={`w-4 h-4 rounded-full ${estado.color}`} aria-hidden="true" />
              {estado.texto}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onEditar}
        className="self-start sm:self-center bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2 rounded-full"
      >
        {textoEditar}
      </button>
    </div>
  );
};

const Tarjeta = ({ titulo, valor }: { titulo: string; valor: string }) => (
  <div className="border border-gray-400 rounded-xl overflow-hidden text-center">
    <p className="bg-gray-500 text-white text-xs font-semibold py-1.5">{titulo}</p>
    <p className="py-2 text-gray-700">{valor}</p>
  </div>
);

const etiquetasDe = (categoria: ProductoDetalle["categoria"]) =>
  categoria ? [categoria.categoriaPadre?.denominacion, categoria.nombre].filter((x): x is string => !!x) : [];

function useCarga<T>(cargar: () => Promise<T>) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    cargar()
      .then(setDatos)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar el detalle."));
    // se carga una vez por diálogo abierto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { datos, error };
}

// ---------- Detalle de producto (enunciado, historia #20, figura 53) ----------

export const DetalleProductoAdmin = ({ id, onClose, onEditar }: { id: number; onClose: () => void; onEditar: () => void }) => {
  const { datos: p, error } = useCarga(() => obtenerProductoDetalle(id));

  const costoLinea = (d: ProductoDetalle["detalles"][number]) => {
    const factor = factorDeUnidad(d.unidadComponente);
    if (d.costoUnitarioComponente == null || factor == null) return null;
    return d.cantidad * factor * d.costoUnitarioComponente;
  };

  return (
    <Marco titulo="Detalle Catálogo" onClose={onClose}>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!p && !error && <p className="text-sm text-gray-500">Cargando...</p>}
      {p && (
        <>
          <Encabezado
            id={p.id}
            nombre={p.denominacion}
            imagen={p.imagenes?.[0]?.url ?? null}
            etiquetas={etiquetasDe(p.categoria)}
            estado={p.disponible === false ? { texto: "Sin stock", color: "bg-red-500" } : { texto: "Stock suficiente", color: "bg-green-500" }}
            textoEditar="Editar"
            onEditar={onEditar}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <Tarjeta titulo="Precio costo" valor={pesos(p.precioCosto)} />
            <Tarjeta titulo="Precio venta" valor={pesos(p.precioVenta)} />
            <Tarjeta titulo="Ganancia" valor={pesos(p.ganancia)} />
          </div>

          <h3 className="text-2xl text-gray-700 mb-3">Detalle preparación</h3>
          {p.detalles.length === 0 ? (
            <p className="text-sm text-gray-600 border border-gray-300 rounded-lg p-3">
              Este producto no tiene ingredientes cargados: su costo queda en $0 y no descuenta stock.
            </p>
          ) : (
            <div className="border border-gray-300 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-500 text-white text-xs text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Cantidad</th>
                    <th className="px-3 py-2 font-semibold">Denominación</th>
                    <th className="px-3 py-2 font-semibold">Costo unit.</th>
                    <th className="px-3 py-2 font-semibold">Costo total</th>
                  </tr>
                </thead>
                <tbody>
                  {p.detalles.map((d) => (
                    <tr key={d.idComponente} className="border-t border-gray-200 text-gray-700">
                      <td className="px-3 py-2">
                        {d.cantidad.toLocaleString("es-AR")} {d.unidadComponente ?? ""}
                      </td>
                      <td className="px-3 py-2">{d.nombreComponente}</td>
                      <td className="px-3 py-2">
                        {pesos(d.costoUnitarioComponente)} x {unidadBase(d.unidadComponente)}
                      </td>
                      <td className="px-3 py-2">{pesos(costoLinea(d))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">Última modificación: {fechaHora(p.fechaModificacion)}</p>
        </>
      )}
    </Marco>
  );
};

// ---------- Detalle de insumo (enunciado, historia #27, figura 66) ----------

export const DetalleInsumoAdmin = ({ id, onClose, onEditar }: { id: number; onClose: () => void; onEditar: () => void }) => {
  const { datos: i, error } = useCarga<InsumoDetalle>(() => obtenerInsumoDetalle(id));
  const unidad = i?.unidadMedida?.abreviatura ?? "";
  const stock = (valor: number | null) => (valor == null ? "—" : `${valor.toLocaleString("es-AR")} ${unidad}`.trim());

  return (
    <Marco titulo="Detalle insumo" onClose={onClose}>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!i && !error && <p className="text-sm text-gray-500">Cargando...</p>}
      {i && (
        <>
          <Encabezado
            id={i.id}
            nombre={i.denominacion}
            imagen={i.imagenUrl}
            etiquetas={etiquetasDe(i.categoria)}
            estado={i.nivelStock ? ESTADO_STOCK[i.nivelStock] : null}
            textoEditar="Editar insumo"
            onEditar={onEditar}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Tarjeta titulo="Precio costo" valor={`${pesos(i.precioCompra)}${unidad ? ` x ${unidadBase(unidad)}` : ""}`} />
            <Tarjeta titulo="Stock actual" valor={stock(i.stockActual)} />
            <Tarjeta titulo="Stock mínimo" valor={stock(i.stockMinimo)} />
            <Tarjeta titulo="Stock máximo" valor={stock(i.stockMaximo)} />
          </div>
          <p className="text-sm text-gray-600">
            {i.esParaElaborar === false
              ? `Se vende directo en el menú a ${pesos(i.precioVenta)}.`
              : "Se usa para elaborar productos (no se vende suelto)."}
          </p>
          <p className="text-xs text-gray-500 mt-3">Última modificación: {fechaHora(i.fechaModificacion)}</p>
        </>
      )}
    </Marco>
  );
};
