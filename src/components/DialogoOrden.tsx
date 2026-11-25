import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import { FiUser, FiTruck, FiClock, FiCreditCard, FiInfo, FiList } from "react-icons/fi";
import { ApiError } from "../api/client";
import {
  cambiarEstadoPedido,
  confirmarCobroEfectivo,
  rechazarPedido,
  verificarPagoMercadoPago,
  type EstadoPedidoApi,
  type ItemCocina,
} from "../services/pedidoService";
import { obtenerGestion, obtenerVistaPreviaFactura, type PedidoGestion } from "../services/ordenesService";
import { esPagoOnline, nombrePasarela } from "../utils/formaPago";
import { urlDeImagen } from "../utils/imagen";

export const ETIQUETA_ESTADO: Record<EstadoPedidoApi, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  DEMORADO: "Demorado",
  PREPARADO: "Listo",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const MAX_MOTIVO = 255;
const ORDEN_ESTADOS: EstadoPedidoApi[] = ["PENDIENTE", "EN_PROCESO", "DEMORADO", "PREPARADO", "EN_CAMINO", "ENTREGADO", "CANCELADO"];
type Pestania = "detalles" | "productos" | "factura";

const formatearFechaHora = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const pesos = (monto: number) => `$${monto.toLocaleString("es-AR")}`;

interface Props {
  idPedido: number;
  // "caja": Órdenes (cajero/admin), con Envío, Pago, acciones de cobro y pestaña Factura.
  // "cocina": solo Cliente, Estado y Productos (figuras 37 y 38).
  modo: "caja" | "cocina";
  onClose: () => void;
  // Se llama después de cualquier cambio, para que la tabla se recargue.
  onActualizado: (mensaje: string) => void;
}

const Seccion = ({ icono, titulo, children }: { icono: React.ReactNode; titulo: string; children: React.ReactNode }) => (
  <section className="mb-5">
    <h3 className="flex items-center gap-2 text-gray-700 text-lg mb-2">
      <span aria-hidden="true">{icono}</span>
      {titulo}
    </h3>
    {children}
  </section>
);

const Pastilla = ({ texto }: { texto: string }) => (
  <span className="inline-block border border-gray-400 rounded-full px-3 py-0.5 text-sm text-gray-700">{texto}</span>
);

// Producto del pedido; en un combo se listan debajo los productos que incluye.
const FilaProducto = ({ item, nivel = 0 }: { item: ItemCocina & { imagenUrl?: string | null }; nivel?: number }) => {
  const [verPreparacion, setVerPreparacion] = useState(false);
  const imagen = urlDeImagen(item.imagenUrl ?? null);
  return (
    <>
      <tr className="border-t border-gray-200 align-top">
        <td className="px-3 py-2" style={{ paddingLeft: 12 + nivel * 20 }}>
          {imagen ? (
            <img src={imagen} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <span className="block w-9 h-9 rounded-full bg-gray-300" aria-hidden="true" />
          )}
        </td>
        <td className="px-3 py-2">
          <span className={nivel > 0 ? "text-gray-600" : ""}>{item.nombre}</span>
          {item.preparacion && (
            <button
              type="button"
              onClick={() => setVerPreparacion((v) => !v)}
              className="ml-2 text-xs text-amber-700 border border-amber-700 rounded px-2 py-0.5 hover:bg-amber-50"
            >
              {verPreparacion ? "Ocultar preparación" : "Ver preparación"}
            </button>
          )}
          {verPreparacion && item.preparacion && (
            <p className="text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded p-2 mt-1 whitespace-pre-line">
              {item.preparacion}
            </p>
          )}
        </td>
        <td className="px-3 py-2">{item.cantidad}</td>
      </tr>
      {item.incluye.map((sub, i) => (
        <FilaProducto key={i} item={sub} nivel={nivel + 1} />
      ))}
    </>
  );
};

// Diálogo de una orden (enunciado, historias #4 a #6 y #8 a #9, figuras 33 a 38).
const DialogoOrden = ({ idPedido, modo, onClose, onActualizado }: Props) => {
  const [pedido, setPedido] = useState<PedidoGestion | null>(null);
  const [pestania, setPestania] = useState<Pestania>("detalles");
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [estadoElegido, setEstadoElegido] = useState<EstadoPedidoApi | "">("");
  const [motivo, setMotivo] = useState("");
  const [fallaReintegro, setFallaReintegro] = useState(false);
  const [envioAbierto, setEnvioAbierto] = useState(true);
  const [facturaHtml, setFacturaHtml] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setPedido(await obtenerGestion(idPedido));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos cargar la orden.");
    }
  }, [idPedido]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (pestania !== "factura" || !pedido?.idFactura || facturaHtml !== null) return;
    obtenerVistaPreviaFactura(pedido.idFactura)
      .then(setFacturaHtml)
      .catch(() => setFacturaHtml(""));
  }, [pestania, pedido, facturaHtml]);

  // Un efectivo se cobra antes de entregarlo en el mostrador (si no, desaparece de la lista sin cobrar).
  const faltaCobrarEfectivo = pedido?.formaPago === "EFECTIVO" && pedido.estadoPago !== "PAGADO";
  const opciones = (pedido?.estadosPermitidos ?? []).filter((e) => !(e === "ENTREGADO" && faltaCobrarEfectivo))
    // En el orden del recorrido del pedido (Cancelado al final).
    .sort((x, y) => ORDEN_ESTADOS.indexOf(x) - ORDEN_ESTADOS.indexOf(y));

  const ejecutar = async (accion: () => Promise<unknown>, mensaje: string) => {
    setProcesando(true);
    setError(null);
    try {
      await accion();
      await cargar();
      setEstadoElegido("");
      setMotivo("");
      setFallaReintegro(false);
      onActualizado(mensaje);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos completar la acción.");
      if (estadoElegido === "CANCELADO" && pedido?.formaPago === "MERCADO_PAGO" && pedido.estadoPago === "PAGADO") {
        setFallaReintegro(true);
      }
    } finally {
      setProcesando(false);
    }
  };

  const actualizarEstado = (reintegroManual = false) => {
    if (!pedido || !estadoElegido) return;
    if (estadoElegido === "CANCELADO") {
      if (!motivo.trim()) {
        setError("Escribí el motivo de la cancelación: el cliente lo ve en Mis órdenes.");
        return;
      }
      ejecutar(() => rechazarPedido(pedido.id, motivo.trim(), reintegroManual), "Se ha actualizado el estado");
      return;
    }
    ejecutar(() => cambiarEstadoPedido(pedido.id, estadoElegido), "Se ha actualizado el estado");
  };

  const estiloPestania = (activa: boolean) =>
    `px-6 py-2 text-sm border-b-2 ${activa ? "border-gray-700 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"}`;

  const pestanias: { id: Pestania; etiqueta: string }[] = [
    { id: "detalles", etiqueta: "Detalles" },
    { id: "productos", etiqueta: "Productos" },
    ...(modo === "caja" ? [{ id: "factura" as Pestania, etiqueta: "Factura" }] : []),
  ];

  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] px-4 py-6">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-full flex flex-col text-black"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-orden"
      >
        <div className="flex items-center justify-between bg-gray-200 rounded-t-xl px-6 py-4">
          <h2 id="titulo-orden" className="text-xl text-gray-700">
            Orden {idPedido}
          </h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-gray-600 hover:text-black">
            <MdClose className="text-2xl" />
          </button>
        </div>
        <div role="tablist" aria-label="Secciones de la orden" className="flex border-b border-gray-200 px-4">
          {pestanias.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={pestania === p.id}
              onClick={() => setPestania(p.id)}
              className={estiloPestania(pestania === p.id)}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 mb-4">{error}</p>}
          {!pedido && !error && <p className="text-sm text-gray-500">Cargando...</p>}

          {pedido && pestania === "detalles" && (
            <>
              <Seccion icono={<FiUser />} titulo="Cliente">
                <div className="border border-gray-300 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs text-left">
                        <th className="font-normal px-3 py-2">Nombre</th>
                        <th className="font-normal px-3 py-2">Email</th>
                        <th className="font-normal px-3 py-2">Teléfono</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-200">
                        <td className="px-3 py-2">{pedido.cliente?.nombre ?? "—"}</td>
                        <td className="px-3 py-2">{pedido.cliente?.email ?? "—"}</td>
                        <td className="px-3 py-2">{pedido.cliente?.telefono ?? "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Seccion>

              {modo === "caja" && (
                <Seccion icono={<FiTruck />} titulo="Envío">
                  {pedido.tipoEnvio === "DELIVERY" ? (
                    <div className="border border-gray-300 rounded-lg">
                      <button
                        type="button"
                        aria-expanded={envioAbierto}
                        onClick={() => setEnvioAbierto((v) => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600"
                      >
                        <span>Envío: A domicilio</span>
                        <span aria-hidden="true">{envioAbierto ? "▲" : "▼"}</span>
                      </button>
                      {envioAbierto && (
                        <div className="border-t border-gray-200 px-3 py-2 text-sm">
                          <p className="mb-2">{pedido.direccionEnvio ?? "—"}</p>
                          {pedido.direccionEnvio && (
                            <iframe
                              title={`Mapa de ${pedido.direccionEnvio}`}
                              src={`https://www.google.com/maps?q=${encodeURIComponent(`${pedido.direccionEnvio}, Mendoza, Argentina`)}&output=embed`}
                              className="w-full h-48 rounded border-0"
                              loading="lazy"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600">Envío: A retirar</p>
                  )}
                  {pedido.repartidor && (
                    <div className="border border-gray-300 rounded-lg overflow-x-auto mt-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 text-xs text-left">
                            <th className="font-normal px-3 py-2">Portador</th>
                            <th className="font-normal px-3 py-2">Teléfono</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-gray-200">
                            <td className="px-3 py-2">{pedido.repartidor.nombre}</td>
                            <td className="px-3 py-2">{pedido.repartidor.telefono ?? "—"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </Seccion>
              )}

              <Seccion icono={<FiClock />} titulo="Estado de la orden">
                <div className="border border-gray-300 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs text-left">
                        <th className="font-normal px-3 py-2">Estado</th>
                        <th className="font-normal px-3 py-2">Actualizado el</th>
                        <th className="font-normal px-3 py-2">Actualizado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.historial.length === 0 ? (
                        <tr className="border-t border-gray-200">
                          <td className="px-3 py-2"><Pastilla texto={ETIQUETA_ESTADO[pedido.estado]} /></td>
                          <td className="px-3 py-2 text-gray-500" colSpan={2}>Sin registro previo</td>
                        </tr>
                      ) : (
                        pedido.historial.map((h, i) => (
                          <tr key={i} className="border-t border-gray-200">
                            <td className="px-3 py-2"><Pastilla texto={ETIQUETA_ESTADO[h.estado]} /></td>
                            <td className="px-3 py-2">{formatearFechaHora(h.fecha)}</td>
                            <td className="px-3 py-2">{h.usuario}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {pedido.motivoCancelacion && (
                  <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2 mt-2">
                    Motivo de la cancelación: {pedido.motivoCancelacion}
                  </p>
                )}

                {opciones.length > 0 ? (
                  <div className="mt-3">
                    <div className="flex gap-2 items-end">
                      <label className="flex-1 text-xs text-gray-500">
                        Estado *
                        <select
                          value={estadoElegido}
                          onChange={(e) => {
                            setEstadoElegido(e.target.value as EstadoPedidoApi | "");
                            setFallaReintegro(false);
                            setError(null);
                          }}
                          className="block w-full mt-1 border border-gray-300 rounded-md px-2 py-2 text-sm text-black bg-white"
                        >
                          <option value="">Elegí el nuevo estado</option>
                          {opciones.map((e) => (
                            <option key={e} value={e}>
                              {ETIQUETA_ESTADO[e]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        onClick={() => actualizarEstado(false)}
                        disabled={!estadoElegido || procesando}
                        className="border border-gray-500 rounded-full px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50"
                      >
                        {procesando ? "Actualizando..." : "↻ Actualizar"}
                      </button>
                    </div>
                    {estadoElegido === "CANCELADO" && (
                      <div className="mt-2">
                        <label htmlFor="motivo-cancelacion" className="text-xs text-gray-500">
                          Motivo (lo ve el cliente) *
                        </label>
                        <textarea
                          id="motivo-cancelacion"
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          maxLength={MAX_MOTIVO}
                          rows={2}
                          placeholder="Ej: no nos queda rúcula para la pizza"
                          className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none"
                        />
                        {esPagoOnline(pedido.formaPago) && pedido.estadoPago === "PAGADO" && (
                          <p className="text-xs text-gray-600">
                            {pedido.formaPago === "MERCADO_PAGO"
                              ? "Ya está pagado: se le devuelve el pago por Mercado Pago."
                              : 'Ya está pagado con criptomonedas: queda en "Pagos para devolver".'}
                          </p>
                        )}
                        {fallaReintegro && (
                          <button
                            onClick={() => actualizarEstado(true)}
                            disabled={procesando}
                            className="mt-2 w-full bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold py-2 rounded-md disabled:opacity-60"
                          >
                            Cancelar igual y devolver desde Mercado Pago
                          </button>
                        )}
                      </div>
                    )}
                    {faltaCobrarEfectivo && pedido.estadosPermitidos.includes("ENTREGADO") && (
                      <p className="text-xs text-gray-600 mt-2">Confirmá el cobro en efectivo antes de entregarlo.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    {pedido.estado === "ENTREGADO" || pedido.estado === "CANCELADO"
                      ? "La orden ya terminó."
                      : pedido.tipoEnvio === "DELIVERY" && pedido.estado === "PREPARADO"
                        ? "Lista para que la lleve un repartidor."
                        : "No hay cambios de estado disponibles para tu rol."}
                  </p>
                )}
              </Seccion>

              {modo === "caja" && (
                <Seccion icono={<FiCreditCard />} titulo="Pago">
                  <div className="border border-gray-300 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-xs text-left">
                          <th className="font-normal px-3 py-2">Transacción</th>
                          <th className="font-normal px-3 py-2">Método de pago</th>
                          <th className="font-normal px-3 py-2">Monto</th>
                          <th className="font-normal px-3 py-2">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-gray-200">
                          <td className="px-3 py-2">{pedido.pago.transaccion ?? "—"}</td>
                          <td className="px-3 py-2">{pedido.pago.metodo}</td>
                          <td className="px-3 py-2">{pesos(pedido.pago.monto)}</td>
                          <td className="px-3 py-2">
                            {pedido.estadoPago === "PAGADO" ? formatearFechaHora(pedido.pago.fecha) : "Sin pagar"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {pedido.estado !== "CANCELADO" && pedido.estadoPago !== "PAGADO" && (
                    <div className="mt-3">
                      {esPagoOnline(pedido.formaPago) ? (
                        <button
                          onClick={() =>
                            ejecutar(() => verificarPagoMercadoPago(pedido.id), `Se consultó el pago en ${nombrePasarela(pedido.formaPago)}`)
                          }
                          disabled={procesando}
                          className="w-full border border-amber-700 text-amber-700 hover:bg-amber-50 font-semibold py-2 rounded-md text-sm disabled:opacity-60"
                        >
                          Verificar pago en {nombrePasarela(pedido.formaPago)}
                        </button>
                      ) : (
                        <button
                          onClick={() => ejecutar(() => confirmarCobroEfectivo(pedido.id), "Se confirmó el cobro en efectivo")}
                          disabled={procesando}
                          className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md text-sm disabled:opacity-60"
                        >
                          Confirmar cobro en efectivo
                        </button>
                      )}
                    </div>
                  )}
                </Seccion>
              )}
            </>
          )}

          {pedido && pestania === "productos" && (
            <>
              <Seccion icono={<FiInfo />} titulo="Aclaraciones del cliente">
                <textarea
                  readOnly
                  aria-label="Aclaraciones del cliente"
                  value={pedido.aclaraciones || "Este pedido no tiene aclaraciones..."}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-700 resize-none"
                />
              </Seccion>
              <Seccion icono={<FiList />} titulo="Detalle">
                <div className="border border-gray-300 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs text-left">
                        <th className="font-normal px-3 py-2 w-16">Imagen</th>
                        <th className="font-normal px-3 py-2">Denominación</th>
                        <th className="font-normal px-3 py-2 w-24">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.items.map((item, i) => (
                        <FilaProducto key={i} item={item} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Seccion>
            </>
          )}

          {pedido && pestania === "factura" && (
            pedido.idFactura ? (
              facturaHtml === null ? (
                <p className="text-sm text-gray-500">Cargando la factura...</p>
              ) : facturaHtml === "" ? (
                <p className="text-sm text-red-600">No pudimos cargar la factura.</p>
              ) : (
                <iframe title="Vista previa de la factura" srcDoc={facturaHtml} className="w-full h-[60vh] border border-gray-300 rounded-lg" />
              )
            ) : (
              <p className="text-sm text-gray-600 border border-gray-300 rounded-lg p-4">
                Todavía no hay factura: se genera cuando el pedido está entregado y pagado.
              </p>
            )
          )}
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default DialogoOrden;
