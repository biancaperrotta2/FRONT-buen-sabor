import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { ApiError } from "../api/client";
import {
  misPedidos,
  type EstadoPagoApi,
  type EstadoPedidoApi,
  type PedidoResumen,
} from "../services/pedidoService";
import { abrirFacturaPorPedido } from "../services/facturaService";

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

const formatearFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

// "3 productos: Pizza Muzzarella, Papas y 1 más": el cliente reconoce el pedido sin abrirlo.
const resumirProductos = (pedido: PedidoResumen) => {
  const unidades = pedido.detalles.reduce((total, d) => total + d.cantidad, 0);
  const nombres = pedido.detalles.map((d) => d.nombreArticulo ?? d.articuloManufacturado?.denominacion ?? "Producto");
  const visibles = nombres.slice(0, 2).join(", ");
  const resto = nombres.length - 2;
  return `${unidades} ${unidades === 1 ? "producto" : "productos"}: ${visibles}${
    resto > 0 ? ` y ${resto} más` : ""
  }`;
};

export const MisPedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<PedidoResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [abriendoFactura, setAbriendoFactura] = useState<number | null>(null);

  const alternarDetalle = (idPedido: number) =>
    setExpandido((prev) => (prev === idPedido ? null : idPedido));

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

  useEffect(() => {
    misPedidos()
      .then(setPedidos)
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "No pudimos cargar tus pedidos."
        )
      );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-32 px-6 max-w-3xl mx-auto pb-16">
        <h1 className="text-2xl font-bold mb-6">Mis pedidos</h1>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        {pedidos === null && !error && (
          <p className="text-gray-500 text-sm">Cargando...</p>
        )}

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

        <div className="space-y-3">
          {pedidos?.map((pedido) => (
            <div
              key={pedido.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              {/* Tocar la tarjeta también abre el detalle, pero lo que se le muestra al cliente
                  es el botón "Ver detalle", que es el que se puede leer y usar con teclado. */}
              <div
                onClick={() => alternarDetalle(pedido.id)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      Pedido #{pedido.id} — {formatearFecha(pedido.fechaPedido)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {pedido.tipoEnvio === "DELIVERY" ? "Delivery" : "Retiro en tienda"} ·{" "}
                      {pedido.formaPago === "EFECTIVO" ? "Efectivo" : "Mercado Pago"}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{resumirProductos(pedido)}</p>
                    {pedido.estadoPedido === "CANCELADO" && pedido.motivoCancelacion && (
                      <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-2 mt-2" role="status">
                        El local rechazó tu pedido: {pedido.motivoCancelacion}
                        {pedido.estadoPago === "REINTEGRADO" && " Te devolvimos el pago a tu cuenta de Mercado Pago."}
                        {pedido.reintegroPendiente && " Te vamos a devolver el pago a tu cuenta de Mercado Pago."}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${ESTADO_COLOR[pedido.estadoPedido]}`}
                    >
                      {ESTADO_LABEL[pedido.estadoPedido]}
                    </span>
                    <span className="font-bold">${pedido.total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    aria-expanded={expandido === pedido.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      alternarDetalle(pedido.id);
                    }}
                    className="cursor-pointer inline-flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-md border border-amber-700 text-amber-800 hover:bg-amber-50"
                  >
                    {expandido === pedido.id ? "Ocultar detalle" : "Ver detalle"}
                    <span aria-hidden="true">{expandido === pedido.id ? "▲" : "▼"}</span>
                  </button>
                </div>
              </div>

              {expandido === pedido.id && (
                <div className="mt-4 border-t pt-3 text-sm">
                  <p className="text-gray-600 mb-2">
                    {pedido.tipoEnvio === "DELIVERY" ? "Entrega: " : ""}
                    {pedido.domicilioSnapshot}
                  </p>
                  <p className="text-gray-600 mb-3">
                    {ESTADO_PAGO_LABEL[pedido.estadoPago]}
                  </p>
                  <table className="w-full border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-2">Producto</th>
                        <th className="text-right p-2">Cant.</th>
                        <th className="text-right p-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedido.detalles.map((detalle, i) => (
                        <tr key={i}>
                          <td className="p-2">
                            {detalle.nombreArticulo ?? detalle.articuloManufacturado?.denominacion ?? "Producto"}
                          </td>
                          <td className="p-2 text-right">{detalle.cantidad}</td>
                          <td className="p-2 text-right">
                            ${detalle.subtotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-3">
                    <button
                      onClick={() => handleVerFactura(pedido.id)}
                      disabled={pedido.idFactura === null || abriendoFactura === pedido.id}
                      title={pedido.idFactura === null ? "Factura no disponible todavía" : undefined}
                      className="text-sm font-semibold px-4 py-2 rounded-md text-white bg-amber-700 hover:bg-amber-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {abriendoFactura === pedido.id
                        ? "Abriendo..."
                        : pedido.idFactura === null
                          ? "Factura no disponible todavía"
                          : "Ver factura"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MisPedidos;
