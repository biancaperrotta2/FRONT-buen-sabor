import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import { useCarrito } from "../context/CarritoContext";
import { Boton } from "./Boton";

interface Props {
  onClose: () => void;
  direccion: string;
}

// ✅ Función auxiliar para obtener precio correcto
const obtenerPrecioUnitario = (item: any): number => {
  if ("precioPromocional" in item && typeof item.precioPromocional === "number") {
    return item.precioPromocional;
  } else if ("precioVenta" in item && typeof item.precioVenta === "number") {
    return item.precioVenta;
  }
  return 0;
};

const ModalConfirmacionOrden = ({ onClose, direccion }: Props) => {
  const { productos, tipoEntrega } = useCarrito();

  const codigoSeguimiento = Math.floor(100000 + Math.random() * 900000); 

  const horaEntrega = () => {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 40); 
    return ahora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
            Su pedido llegará aproximadamente a las {horaEntrega()}
          </p>
          <p className="mb-1">
            {tipoEntrega === "tienda" ? "Retiro en tienda" : "Delivery"} – {direccion}
          </p>
          <p className="mb-2">
            Código de Pedido: <strong>{codigoSeguimiento}</strong>
          </p>
          <hr />
        </div>

        <div className="text-sm mb-4">
          <p className="font-medium mb-2">Detalles de la Orden</p>
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2">Productos</th>
                <th className="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod) => (
                <tr key={prod.idUnico}>
                  <td className="p-2">
                    {prod.cantidad} x <strong>{prod.item.denominacion}</strong>
                  </td>
                  <td className="p-2 text-right">
                    ${(
                      obtenerPrecioUnitario(prod.item) * prod.cantidad
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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


