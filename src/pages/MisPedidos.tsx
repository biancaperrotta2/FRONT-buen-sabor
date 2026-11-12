import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Modal } from "../components/Modal";
import { ApiError, apiFetchJson } from "../api/client";
import {
  misPedidos,
  type EstadoPagoApi,
  type EstadoPedidoApi,
  type PedidoResumen,
} from "../services/pedidoService";
import { abrirFacturaPorPedido } from "../services/facturaService";
import { listarInsumosVendibles } from "../services/insumoService";
import { listarPromocionesVigentes } from "../services/promocionService";
import { mapearBase } from "../context/ProductosContext";
import { useCarrito } from "../context/CarritoContext";
import type { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import type { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import type { Promocion } from "../classes/PromocionClass";

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

const ESTADO_LABEL: Record<EstadoPedidoApi, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En preparación",
  DEMORADO: "Demorado",
  PREPARADO: "Listo",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const ESTADO_COLOR: Record<EstadoPedidoApi, string> = {
  PENDIENTE: "bg-gray-200 text-gray-800",
  EN_PROCESO: "bg-blue-100 text-blue-800",
  DEMORADO: "bg-yellow-100 text-yellow-800",
  PREPARADO: "bg-purple-100 text-purple-800",
  EN_CAMINO: "bg-indigo-100 text-indigo-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const ESTADO_PAGO_LABEL: Record<EstadoPagoApi, string> = {
  PENDIENTE: "Pago pendiente",
  PAGADO: "Pagado",
  RECHAZADO: "Pago rechazado",
  REINTEGRADO: "Pago devuelto a tu Mercado Pago",
};

// Enunciado, historia #11: "Órdenes pasadas" son las finalizadas o canceladas; el resto, pendientes.
const ESTADOS_PASADOS: EstadoPedidoApi[] = ["ENTREGADO", "CANCELADO"];

type Pestania = "pendientes" | "pasadas";
type Orden = "recientes" | "antiguos" | "total-asc" | "total-desc";

const OPCIONES_ORDEN: { valor: Orden; etiqueta: string }[] = [
  { valor: "recientes", etiqueta: "Predeterminado (más recientes)" },
  { valor: "antiguos", etiqueta: "Más antiguos primero" },
  { valor: "total-asc", etiqueta: "Total: menor a mayor" },
  { valor: "total-desc", etiqueta: "Total: mayor a menor" },
];

// El id crece con cada pedido, así que ordena por fecha y hora de creación sin más datos.
const comparar = (orden: Orden) => (a: PedidoResumen, b: PedidoResumen) => {
  switch (orden) {
    case "antiguos":
      return a.id - b.id;
    case "total-asc":
      return a.total - b.total;
    case "total-desc":
      return b.total - a.total;
    default:
      return b.id - a.id;
  }
};

const formatearFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

const formatearHora = (hora: string | null) => (hora ? hora.slice(0, 5) : "—");
const pesos = (monto: number) => `$${monto.toLocaleString("es-AR")}`;
const nombreDe = (d: PedidoResumen["detalles"][number]) =>
  d.nombreArticulo ?? d.articuloManufacturado?.denominacion ?? "Producto";

// "3 productos: Pizza Muzzarella, Papas y 1 más": el cliente reconoce el pedido sin abrirlo.
const resumirProductos = (pedido: PedidoResumen) => {
  const unidades = pedido.detalles.reduce((total, d) => total + d.cantidad, 0);
  const nombres = pedido.detalles.map(nombreDe);
  const visibles = nombres.slice(0, 2).join(", ");
  const resto = nombres.length - 2;
  return `${unidades} ${unidades === 1 ? "producto" : "productos"}: ${visibles}${
    resto > 0 ? ` y ${resto} más` : ""
  }`;
};

const AvisoRechazo = ({ pedido }: { pedido: PedidoResumen }) =>
  pedido.estadoPedido === "CANCELADO" && pedido.motivoCancelacion ? (
    <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2 mt-2" role="status">
      El local rechazó tu pedido: {pedido.motivoCancelacion}
      {pedido.estadoPago === "REINTEGRADO" && " Te devolvimos el pago a tu cuenta de Mercado Pago."}
      {pedido.reintegroPendiente && " Te vamos a devolver el pago a tu cuenta de Mercado Pago."}
    </p>
  ) : null;

export const MisPedidos = () => {
  const navigate = useNavigate();
  const { productos: enCarrito, reemplazarCarrito, setTipoEntrega, setCarritoAbierto } = useCarrito();
  const [pedidos, setPedidos] = useState<PedidoResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pestania, setPestania] = useState<Pestania>("pendientes");
  const [orden, setOrden] = useState<Orden>("recientes");
  const [detalle, setDetalle] = useState<PedidoResumen | null>(null);
  const [abriendoFactura, setAbriendoFactura] = useState<number | null>(null);

  // "Repetir orden": mientras busca en el menú, el aviso si algo ya no está, y la confirmación
  // si el carrito ya tenía productos.
  const [repitiendo, setRepitiendo] = useState<number | null>(null);
  const [noRepetible, setNoRepetible] = useState<{ pedido: PedidoResumen; faltan: string[] } | null>(null);
  const [aReemplazar, setAReemplazar] = useState<{ pedido: PedidoResumen; items: { item: ArticuloMenu; cantidad: number }[] } | null>(null);

  useEffect(() => {
    misPedidos()
      .then(setPedidos)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar tus pedidos."));
  }, []);

  const handleVerFactura = async (idPedido: number) => {
    setAbriendoFactura(idPedido);
    try {
      await abrirFacturaPorPedido(idPedido);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos abrir la factura.");
    } finally {
      setAbriendoFactura(null);
    }
  };

  const cargarEnCarrito = (pedido: PedidoResumen, items: { item: ArticuloMenu; cantidad: number }[]) => {
    reemplazarCarrito(items);
    setTipoEntrega(pedido.tipoEnvio === "DELIVERY" ? "delivery" : "tienda");
    setAReemplazar(null);
    setCarritoAbierto(true);
    navigate("/menupage");
  };

  // Busca cada producto del pedido en el menú de hoy (con su precio y stock actuales). Si alguno
  // ya no se vende o no tiene stock, la orden no se repite (enunciado, criterio 7).
  const handleRepetir = async (pedido: PedidoResumen) => {
    setRepitiendo(pedido.id);
    setError(null);
    try {
      const [platos, insumos, promos] = await Promise.all([
        apiFetchJson<unknown[]>("/articulo-manufacturado").then((lista) => lista.map(mapearBase)),
        listarInsumosVendibles(),
        listarPromocionesVigentes(),
      ]);
      const menu = new Map<number, ArticuloMenu>();
      [...platos, ...insumos, ...promos].forEach((a) => a.id != null && menu.set(a.id, a));

      const items: { item: ArticuloMenu; cantidad: number }[] = [];
      const faltan: string[] = [];
      pedido.detalles.forEach((d) => {
        const articulo = d.idArticulo != null ? menu.get(d.idArticulo) : undefined;
        if (!articulo || articulo.disponible === false) faltan.push(nombreDe(d));
        else items.push({ item: articulo, cantidad: d.cantidad });
      });

      if (faltan.length > 0 || items.length === 0) {
        setNoRepetible({ pedido, faltan: faltan.length > 0 ? faltan : pedido.detalles.map(nombreDe) });
      } else if (enCarrito.length > 0) {
        setAReemplazar({ pedido, items });
      } else {
        cargarEnCarrito(pedido, items);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos repetir la orden. Intentá de nuevo.");
    } finally {
      setRepitiendo(null);
    }
  };

  const pendientes = (pedidos ?? []).filter((p) => !ESTADOS_PASADOS.includes(p.estadoPedido));
  const pasadas = (pedidos ?? []).filter((p) => ESTADOS_PASADOS.includes(p.estadoPedido));
  const visibles = (pestania === "pendientes" ? pendientes : pasadas).slice().sort(comparar(orden));

  const estiloPestania = (activa: boolean) =>
    `px-4 py-2 text-sm font-semibold border-b-2 transition ${
      activa ? "border-amber-700 text-amber-800" : "border-transparent text-gray-600 hover:text-gray-900"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-32 px-4 sm:px-6 max-w-5xl mx-auto pb-16">
        <h1 className="text-2xl font-bold mb-6">Mis pedidos</h1>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {pedidos === null && !error && <p className="text-gray-500 text-sm">Cargando...</p>}

        {pedidos !== null && pedidos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-4">Todavía no hiciste ningún pedido.</p>
            <button
              onClick={() => navigate("/menupage")}
              className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-5 py-2 rounded-md"
            >
              Ver el menú
            </button>
          </div>
        )}

        {pedidos !== null && pedidos.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4 border-b border-gray-200">
              <div role="tablist" aria-label="Mis pedidos" className="flex">
                <button
                  role="tab"
                  aria-selected={pestania === "pendientes"}
                  onClick={() => setPestania("pendientes")}
                  className={estiloPestania(pestania === "pendientes")}
                >
                  Pendientes ({pendientes.length})
                </button>
                <button
                  role="tab"
                  aria-selected={pestania === "pasadas"}
                  onClick={() => setPestania("pasadas")}
                  className={estiloPestania(pestania === "pasadas")}
                >
                  Órdenes pasadas ({pasadas.length})
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-800 pb-2">
                <span className="font-semibold whitespace-nowrap">Ordenar por</span>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value as Orden)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white"
                >
                  {OPCIONES_ORDEN.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {visibles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {pestania === "pendientes" ? "No tenés pedidos en curso." : "Todavía no tenés órdenes pasadas."}
                </p>
                <button
                  onClick={() => navigate("/menupage")}
                  className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-5 py-2 rounded-md"
                >
                  Ver el menú
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibles.map((pedido) => {
                  const pasada = ESTADOS_PASADOS.includes(pedido.estadoPedido);
                  const entregado = pedido.estadoPedido === "ENTREGADO";
                  return (
                    <div
                      key={pedido.id}
                      onClick={() => setDetalle(pedido)}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:border-amber-700 transition flex flex-col"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">Pedido #{pedido.id}</p>
                          <p className="text-sm text-gray-500">
                            {formatearFecha(pedido.fechaPedido)} · {pasada ? "Hora estimada" : "Listo aprox."}{" "}
                            {formatearHora(pedido.horaEstimadaFinalizacion)}
                          </p>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${ESTADO_COLOR[pedido.estadoPedido]}`}>
                          {ESTADO_LABEL[pedido.estadoPedido]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {pedido.tipoEnvio === "DELIVERY" ? "Delivery" : "Retiro en tienda"} ·{" "}
                        {pedido.formaPago === "EFECTIVO" ? "Efectivo" : "Mercado Pago"}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{resumirProductos(pedido)}</p>
                      <AvisoRechazo pedido={pedido} />

                      <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
                        {entregado && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerFactura(pedido.id);
                            }}
                            disabled={pedido.idFactura === null || abriendoFactura === pedido.id}
                            title={pedido.idFactura === null ? "Factura no disponible todavía" : undefined}
                            className="text-sm font-semibold px-3 py-2 rounded-md text-white bg-amber-700 hover:bg-amber-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                          >
                            {abriendoFactura === pedido.id
                              ? "Abriendo..."
                              : pedido.idFactura === null
                                ? "Factura no disponible"
                                : "Ver factura"}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRepetir(pedido);
                          }}
                          disabled={repitiendo === pedido.id}
                          className="text-sm font-semibold px-3 py-2 rounded-md border border-amber-700 text-amber-800 hover:bg-amber-50 disabled:opacity-60"
                        >
                          {repitiendo === pedido.id ? "Buscando..." : "Repetir orden"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetalle(pedido);
                          }}
                          className="text-sm font-semibold px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                        >
                          Ver detalle
                        </button>
                        <span className="ml-auto font-bold">{pesos(pedido.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detalle del pedido (enunciado, criterio 8) */}
      <Modal isOpen={detalle !== null} onClose={() => setDetalle(null)} titulo={detalle ? `Pedido #${detalle.id}` : ""} className="max-w-xl">
        {detalle && (
          <div className="text-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ESTADO_COLOR[detalle.estadoPedido]}`}>
                {ESTADO_LABEL[detalle.estadoPedido]}
              </span>
              <span className="text-gray-600">
                {formatearFecha(detalle.fechaPedido)} · Hora estimada {formatearHora(detalle.horaEstimadaFinalizacion)}
              </span>
            </div>
            <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
              <dt className="text-gray-500">Entrega</dt>
              <dd>
                {detalle.tipoEnvio === "DELIVERY" ? `Delivery a ${detalle.domicilioSnapshot}` : "Retiro en tienda"}
              </dd>
              <dt className="text-gray-500">Pago</dt>
              <dd>
                {detalle.formaPago === "EFECTIVO" ? "Efectivo" : "Mercado Pago"} · {ESTADO_PAGO_LABEL[detalle.estadoPago]}
              </dd>
              {detalle.aclaraciones && (
                <>
                  <dt className="text-gray-500">Aclaraciones</dt>
                  <dd>{detalle.aclaraciones}</dd>
                </>
              )}
            </dl>
            <AvisoRechazo pedido={detalle} />
            <table className="w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Producto</th>
                  <th className="text-right p-2">Cant.</th>
                  <th className="text-right p-2">Precio</th>
                  <th className="text-right p-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalle.detalles.map((d, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="p-2">{nombreDe(d)}</td>
                    <td className="p-2 text-right">{d.cantidad}</td>
                    <td className="p-2 text-right">{d.precioUnitario != null ? pesos(d.precioUnitario) : "—"}</td>
                    <td className="p-2 text-right">{pesos(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{pesos(detalle.detalles.reduce((t, d) => t + d.subtotal, 0))}</span>
              </div>
              {!!detalle.descuento && (
                <div className="flex justify-between text-green-700">
                  <span>Descuento retiro en tienda (10%)</span>
                  <span>-{pesos(detalle.descuento)}</span>
                </div>
              )}
              {detalle.tipoEnvio === "DELIVERY" && detalle.gastosEnvio != null && (
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>{pesos(detalle.gastosEnvio)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>Total</span>
                <span>{pesos(detalle.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* La orden no se puede repetir (criterio 7) */}
      <Modal isOpen={noRepetible !== null} onClose={() => setNoRepetible(null)} titulo="No se puede repetir esta orden">
        {noRepetible && (
          <div className="space-y-4 text-sm">
            <p className="text-gray-700">
              {noRepetible.faltan.length === 1 ? "Este producto ya no está disponible:" : "Estos productos ya no están disponibles:"}
            </p>
            <ul className="list-disc pl-5 text-gray-800">
              {noRepetible.faltan.map((nombre, i) => (
                <li key={i}>{nombre}</li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => setNoRepetible(null)}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 rounded-md"
              >
                Cerrar
              </button>
              <button
                onClick={() => navigate("/menupage")}
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md"
              >
                Ver el menú
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* El carrito ya tenía productos */}
      <Modal isOpen={aReemplazar !== null} onClose={() => setAReemplazar(null)} titulo="¿Reemplazar tu carrito?">
        {aReemplazar && (
          <div className="space-y-4 text-sm">
            <p className="text-gray-700">
              Tu carrito ya tiene productos. Si repetís el pedido #{aReemplazar.pedido.id}, se reemplazan por los de esa orden
              (con los precios de hoy).
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setAReemplazar(null)}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={() => cargarEnCarrito(aReemplazar.pedido, aReemplazar.items)}
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md"
              >
                Reemplazar carrito
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MisPedidos;
