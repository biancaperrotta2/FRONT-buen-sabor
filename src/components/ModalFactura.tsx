import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import { useCarrito } from "../context/CarritoContext";
import { useEffect, useState } from "react";
import { Boton } from "./Boton";
import ModalConfirmacionOrden from "./ModalConfirmacionOrden";
import SelectorDomicilio from "./SelectorDomicilio";
import MercadoPagoCheckout from "./MercadoPagoChechout";
import { ApiError } from "../api/client";
import {
  crearPedido,
  crearPreferenciaPago,
  crearPagoCripto,
  type PagoCripto,
  sincronizarCarrito,
  type PedidoCreado,
  type PreferenciaPago,
} from "../services/pedidoService";

// Mismo límite que valida el backend (PedidoRequest.aclaraciones).
const MAX_ACLARACIONES = 255;

interface Props {
  onClose: () => void;
}

// Función para obtener el precio unitario
const obtenerPrecioUnitario = (item: any): number => {
  if ("precioPromocional" in item && typeof item.precioPromocional === "number") {
    return item.precioPromocional;
  } else if ("precioVenta" in item && typeof item.precioVenta === "number") {
    return item.precioVenta;
  }
  return 0;
};

export const ModalFactura = ({ onClose }: Props) => {
  const {
    productos,
    tipoEntrega,
    vaciarCarrito,
    subtotal,
    total,
    deliveryCosto,
    descuentoRetiro,
    domicilioSeleccionado,
    setDomicilioSeleccionado,
  } = useCarrito();
  const [pago, setPago] = useState<"efectivo" | "tarjeta" | "cripto">("efectivo");
  const [pagoCripto, setPagoCripto] = useState<PagoCripto | null>(null);
  const [pedidoCreado, setPedidoCreado] = useState<PedidoCreado | null>(null);
  const [preferenciaPago, setPreferenciaPago] = useState<PreferenciaPago | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aclaraciones, setAclaraciones] = useState("");

  // El pedido ya existe aunque esto falle (ej. la pasarela no responde): por eso es aparte y se puede
  // reintentar desde el mismo diálogo sin crear otro pedido.
  const prepararPagoCripto = async (idPedido: number) => {
    try {
      setPagoCripto(await crearPagoCripto(idPedido));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos preparar el pago con criptomonedas. Probá de nuevo.");
    }
  };

  const handleConfirmar = async () => {
    setError(null);
    if (tipoEntrega === "delivery" && !domicilioSeleccionado) {
      setError("Elegí una dirección de entrega.");
      return;
    }

    setProcesando(true);
    try {
      await sincronizarCarrito(
        productos.map((p) => ({ idArticulo: Number(p.item.id), cantidad: p.cantidad }))
      );

      const pedido = await crearPedido({
        tipoEnvio: tipoEntrega === "delivery" ? "DELIVERY" : "TAKE_AWAY",
        formaPago: pago === "tarjeta" ? "MERCADO_PAGO" : pago === "cripto" ? "CRIPTO" : "EFECTIVO",
        idDomicilio: tipoEntrega === "delivery" ? domicilioSeleccionado?.id ?? null : null,
        aclaraciones: aclaraciones.trim() || undefined,
      });

      vaciarCarrito();
      setPedidoCreado(pedido);

      if (pedido.formaPago === "MERCADO_PAGO") {
        const preferencia = await crearPreferenciaPago(pedido.id);
        setPreferenciaPago(preferencia);
      }
      if (pedido.formaPago === "CRIPTO") {
        await prepararPagoCripto(pedido.id);
      }
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "No pudimos crear el pedido. Intentá de nuevo."
      );
    } finally {
      setProcesando(false);
    }
  };

  // Pedido ya creado y pagado en efectivo (o pendiente de pago en el local): se muestra
  // la confirmación con los datos reales que devolvió el backend.
  if (pedidoCreado && pedidoCreado.formaPago === "EFECTIVO") {
    return (
      <ModalConfirmacionOrden
        pedido={pedidoCreado}
        onClose={() => {
          setPedidoCreado(null);
          onClose();
        }}
      />
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 w-[420px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto relative shadow-xl text-black">
        <button onClick={onClose} className="absolute top-3 right-3">
          <MdClose className="text-xl" />
        </button>

        {pedidoCreado && pedidoCreado.formaPago === "CRIPTO" ? (
          <>
            <h2 className="text-lg font-bold mb-4">
              Pedido #{pedidoCreado.id} creado — completá el pago
            </h2>
            <p className="text-sm text-gray-600 mb-1">
              Total: ${pedidoCreado.total.toLocaleString("es-AR")}
            </p>
            {pagoCripto ? (
              <>
                <p className="text-sm text-gray-700 mb-4">
                  Vas a pagar <span className="font-semibold">{pagoCripto.montoUsd.toLocaleString("es-AR", { minimumFractionDigits: 2 })} USD</span>{" "}
                  en la criptomoneda que elijas (1 USD = ${pagoCripto.cotizacionUsd.toLocaleString("es-AR")}).
                </p>
                <button
                  onClick={() => {
                    window.location.href = pagoCripto.urlPago;
                  }}
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-md font-semibold"
                >
                  Pagar con criptomonedas
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Te llevamos a la página de pago. Cuando termines, volvés acá y ves el resultado.
                </p>
              </>
            ) : (
              <>
                {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                <button
                  onClick={async () => {
                    setError(null);
                    setProcesando(true);
                    await prepararPagoCripto(pedidoCreado.id);
                    setProcesando(false);
                  }}
                  disabled={procesando}
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-md font-semibold disabled:opacity-60"
                >
                  {procesando ? "Preparando..." : "Reintentar pago con criptomonedas"}
                </button>
              </>
            )}
          </>
        ) : pedidoCreado && preferenciaPago ? (
          <>
            <h2 className="text-lg font-bold mb-4">
              Pedido #{pedidoCreado.id} creado — completá el pago
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Total: ${pedidoCreado.total.toLocaleString()}
            </p>
            <MercadoPagoCheckout preferenceId={preferenciaPago.preferenceId} />
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-4">Confirmar Orden</h2>

            <div className="text-sm mb-4">
              <p className="font-medium">Entrega</p>
              <p className="mb-2">
                {tipoEntrega === "tienda" ? "Retiro en tienda" : "Delivery"}
              </p>
              {tipoEntrega === "delivery" && (
                <SelectorDomicilio
                  seleccionado={domicilioSeleccionado}
                  onSeleccionar={setDomicilioSeleccionado}
                />
              )}
              <hr className="mt-2" />
            </div>

            <div className="text-sm mb-4">
              <p className="font-medium mb-2">Productos</p>
              <table className="w-full text-sm border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2">Item</th>
                    <th className="text-right p-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod) => (
                    <tr key={prod.idUnico}>
                      <td className="p-2">
                        {prod.cantidad} x {prod.item.denominacion}
                      </td>
                      <td className="p-2 text-right">
                        ${(obtenerPrecioUnitario(prod.item) * prod.cantidad).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-sm mb-4">
              <label htmlFor="aclaraciones" className="font-medium block mb-2">
                Agregar aclaraciones <span className="text-gray-500 font-normal">(opcional)</span>
              </label>
              <textarea
                id="aclaraciones"
                value={aclaraciones}
                onChange={(e) => setAclaraciones(e.target.value)}
                maxLength={MAX_ACLARACIONES}
                rows={2}
                placeholder="Ej: sin cebolla, la pizza bien cocida"
                className="w-full border border-gray-300 rounded-md p-2 resize-none"
              />
              <p className="text-xs text-gray-500 text-right">
                {aclaraciones.length}/{MAX_ACLARACIONES}
              </p>
            </div>

            <div className="text-sm mb-4">
              <p className="font-medium mb-2">Método de pago</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="efectivo"
                    checked={pago === "efectivo"}
                    onChange={(e) => setPago(e.target.value as "efectivo")}
                  />
                  Efectivo
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="tarjeta"
                    checked={pago === "tarjeta"}
                    onChange={(e) => setPago(e.target.value as "tarjeta")}
                  />
                  Mercado Pago
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="cripto"
                    checked={pago === "cripto"}
                    onChange={(e) => setPago(e.target.value as "cripto")}
                  />
                  Criptomonedas
                </label>
              </div>
            </div>

            <div className="text-sm mb-4 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              {tipoEntrega === "tienda" && descuentoRetiro > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Descuento retiro en tienda (10%)</span>
                  <span>-${descuentoRetiro.toLocaleString()}</span>
                </div>
              )}
              {tipoEntrega === "delivery" && (
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>{deliveryCosto === null ? "A confirmar" : `$${deliveryCosto.toLocaleString()}`}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-1 border-t">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <Boton
              textoBoton={procesando ? "Procesando..." : "REALIZAR ORDEN"}
              onClick={procesando ? () => {} : handleConfirmar}
              estiloBoton="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-md font-semibold disabled:opacity-60"
            />
          </>
        )}
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};
