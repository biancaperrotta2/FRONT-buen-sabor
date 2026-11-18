import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import type { PedidoCreado } from "../services/pedidoService";
import { obtenerLocal } from "../services/localService";
import { nombreFormaPago } from "../utils/formaPago";

interface Props {
  onClose: () => void;
  pedido: PedidoCreado;
}

// El backend devuelve un LocalTime tipo "19:52:41.7861806"; solo interesa HH:mm.
const formatearHora = (hora: string) => hora.slice(0, 5);
const formatearFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};
const pesos = (monto: number) => `$${monto.toLocaleString("es-AR")}`;

// Diálogo de orden recibida (figura 23 del enunciado): hora de entrega, datos de la orden y sus productos.
const ModalConfirmacionOrden = ({ onClose, pedido }: Props) => {
  const [direccionLocal, setDireccionLocal] = useState<string | null>(null);
  const esDelivery = pedido.tipoEnvio === "DELIVERY";

  useEffect(() => {
    if (!esDelivery) {
      obtenerLocal()
        .then((l) => setDireccionLocal(l.direccion))
        .catch(() => setDireccionLocal(null));
    }
  }, [esDelivery]);

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] px-4">
      <div
        className="bg-white rounded-xl p-6 w-[560px] max-w-full max-h-[90vh] overflow-y-auto relative shadow-xl text-black"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-orden-recibida"
      >
        <button onClick={onClose} className="absolute top-4 right-4" aria-label="Cerrar">
          <MdClose className="text-xl" />
        </button>

        <h2 id="titulo-orden-recibida" className="text-xl font-semibold text-gray-700 mb-4">
          Orden recibida
        </h2>

        <p className="text-sm font-semibold text-gray-700 mb-1">Detalles de entrega</p>
        <p className="text-sm text-gray-600">
          {esDelivery
            ? `Su pedido llegará aproximadamente a las ${formatearHora(pedido.horaEstimadaFinalizacion)}`
            : `Su pedido estará listo aproximadamente a las ${formatearHora(pedido.horaEstimadaFinalizacion)}`}
        </p>
        <p className="text-sm text-gray-600 mb-3">
          {esDelivery
            ? `Envío a domicilio • ${pedido.domicilioSnapshot}`
            : `Retiro en tienda${direccionLocal ? ` • ${direccionLocal}` : ""}`}
        </p>

        <div className="border border-gray-300 rounded-lg overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="text-left font-normal px-3 py-2">Número de Orden</th>
                <th className="text-left font-normal px-3 py-2">Fecha</th>
                <th className="text-left font-normal px-3 py-2">Total</th>
                <th className="text-left font-normal px-3 py-2">Forma de pago</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="px-3 py-2">#{pedido.id}</td>
                <td className="px-3 py-2">{formatearFecha(pedido.fechaPedido)}</td>
                <td className="px-3 py-2">{pesos(pedido.total)}</td>
                <td className="px-3 py-2">{nombreFormaPago(pedido.formaPago)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-1">Detalles de la orden</p>
        <div className="border border-gray-300 rounded-lg overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="text-left font-normal px-3 py-2">Denominación</th>
                <th className="text-right font-normal px-3 py-2">Cantidad</th>
                <th className="text-right font-normal px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(pedido.detallePedidos ?? []).map((d, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-3 py-2">{d.nombreArticulo ?? "Producto"}</td>
                  <td className="px-3 py-2 text-right">{d.cantidad}</td>
                  <td className="px-3 py-2 text-right">{pesos(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-10 py-2 rounded-md">
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default ModalConfirmacionOrden;
