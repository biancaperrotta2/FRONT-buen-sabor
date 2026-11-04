import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import { Boton } from "./Boton";
import type { PedidoCreado } from "../services/pedidoService";

interface Props {
  onClose: () => void;
  pedido: PedidoCreado;
}

// El backend devuelve un LocalTime tipo "19:52:41.7861806"; solo interesa HH:mm.
const formatearHora = (hora: string) => hora.slice(0, 5);

const ModalConfirmacionOrden = ({ onClose, pedido }: Props) => {
  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 w-[420px] relative shadow-xl text-black">
        <button onClick={onClose} className="absolute top-3 right-3">
          <MdClose className="text-xl" />
        </button>

        <h2 className="text-lg font-bold mb-4">Orden recibida</h2>

        <div className="text-sm mb-4">
          <p className="font-medium">Detalle de Entrega</p>
          <p className="mb-1">
            Su pedido llegará aproximadamente a las{" "}
            {formatearHora(pedido.horaEstimadaFinalizacion)}
          </p>
          <p className="mb-1">
            {pedido.tipoEnvio === "TAKE_AWAY" ? "Retiro en tienda" : "Delivery"} –{" "}
            {pedido.domicilioSnapshot}
          </p>
          <p className="mb-2">
            Número de Pedido: <strong>#{pedido.id}</strong>
          </p>
          <hr />
        </div>

        <div className="text-sm mb-4">
          <p className="font-medium mb-2">Total</p>
          <p className="text-base font-bold">${pedido.total.toLocaleString()}</p>
        </div>

        <Boton
          textoBoton="CERRAR"
          onClick={onClose}
          estiloBoton="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-md font-semibold"
        />
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default ModalConfirmacionOrden;
