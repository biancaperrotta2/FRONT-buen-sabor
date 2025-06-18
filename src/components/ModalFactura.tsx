import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import { useCarrito } from "../context/CarritoContext";
import { useState } from "react";
import { Boton } from "./Boton";
import ModalConfirmacionOrden from "./ModalConfirmacionOrden";

interface Props {
  onClose: () => void;
  direccion: string;
  handlePagoMercadoPago: () => void;
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

export const ModalFactura = ({
  onClose,
  direccion,
  handlePagoMercadoPago,
}: Props) => {
  const { productos, tipoEntrega } = useCarrito();
  const [pago, setPago] = useState("efectivo");
  const [ordenConfirmada, setOrdenConfirmada] = useState(false);

  const calcularTotal = () => {
    return productos.reduce(
      (acc, prod) => acc + obtenerPrecioUnitario(prod.item) * prod.cantidad,
      0
    );
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg p-6 w-[420px] relative shadow-xl text-black">
          <button onClick={onClose} className="absolute top-3 right-3">
            <MdClose className="text-xl" />
          </button>

          <h2 className="text-lg font-bold mb-4">Confirmar Orden</h2>

          <div className="text-sm mb-4">
            <p className="font-medium">Entrega</p>
            <p className="mb-2">
              {tipoEntrega === "tienda"
                ? "Retiro en tienda"
                : `Delivery a: ${direccion}`}
            </p>
            <hr />
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
                      ${(
                        obtenerPrecioUnitario(prod.item) * prod.cantidad
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-sm mb-4">
            <p className="font-medium mb-2">Método de pago</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="efectivo"
                  checked={pago === "efectivo"}
                  onChange={(e) => setPago(e.target.value)}
                />
                Efectivo
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="tarjeta"
                  checked={pago === "tarjeta"}
                  onChange={(e) => setPago(e.target.value)}
                />
                Mercado Pago
              </label>
            </div>
          </div>

          <div className="text-right text-base font-bold mb-4">
            Total: ${calcularTotal().toLocaleString()}
          </div>

          <Boton
            textoBoton="REALIZAR ORDEN"
            onClick={() => {
              if (pago === "tarjeta") {
                handlePagoMercadoPago();
              } else {
                setOrdenConfirmada(true);
              }
            }}
            estiloBoton="w-full bg-amber-700 hover:bg-amber-800 text-white py-2 rounded-md font-semibold"
          />
        </div>
      </div>

      {ordenConfirmada && (
        <ModalConfirmacionOrden
          direccion={direccion}
          onClose={() => {
            setOrdenConfirmada(false);
            onClose();
          }}
        />
      )}
    </>,
    document.getElementById("modal-root")!
  );
};
