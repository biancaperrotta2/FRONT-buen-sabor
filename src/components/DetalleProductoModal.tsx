import React, { useState, useEffect } from "react";
import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";
import { useCarrito } from "../context/CarritoContext";
import { useAuth } from "../context/AuthContext";  // <-- Importamos useAuth

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

interface DetalleProductoProps {
  visible: boolean;
  onClose: () => void;
  producto: ArticuloMenu | null;
}

const DetalleProductoModal: React.FC<DetalleProductoProps> = ({
  visible,
  onClose,
  producto,
}) => {
  const [cantidad, setCantidad] = useState(1);
  const { agregarAlCarrito } = useCarrito();
  const { usuario } = useAuth(); // <-- Obtenemos usuario

  useEffect(() => {
    if (visible) setCantidad(1);
  }, [visible, producto]);

  if (!visible || !producto) return null;

  let descripcion = "";
  let precio = 0;
  let imagen = "default.jpg";
  let nombre = producto.denominacion;

  if ("descripcionDescuento" in producto) {
    descripcion = producto.descripcionDescuento;
    precio = producto.precioPromocional;
    imagen = "combos.jpeg";
  } else if ("descripcion" in producto) {
    descripcion = producto.descripcion;
    precio = producto.precioVenta;
    imagen = producto.imagen ?? "default.jpg";
  } else if ("esParaElaborar" in producto) {
    descripcion = producto.esParaElaborar
      ? "Insumo para elaboración"
      : "Producto directo al consumidor";
    precio = producto.precioVenta;
    imagen = producto.imagen ?? "default.jpg";
  }

  return (
    <div className="fixed pt-30 inset-0 z-50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-xl overflow-hidden relative">
        <img src={`/assets/img/${imagen}`} alt={nombre} className="w-full h-60 object-cover" />
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-1">{nombre}</h2>
          <p className="text-gray-700 italic mb-4">{descripcion}</p>
          <div className="text-xl font-semibold mb-4">${precio.toFixed(2)}</div>

          <div className="flex items-center justify-between">
            <label className="text-sm mr-2">Cantidad:</label>
            <input
              type="number"
              className="border px-2 py-1 w-20 text-center"
              value={cantidad}
              min={1}
              onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
            />
            <button
              onClick={() => {
                if (usuario) {
                  agregarAlCarrito(producto, cantidad);
                  onClose();
                }
              }}
              disabled={!usuario} // <-- Deshabilitar botón si no hay usuario
              className={`px-4 py-2 rounded-lg ml-auto text-white ${
                usuario
                  ? "bg-orange-600 hover:bg-orange-700 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              title={usuario ? "Agregar a mi orden" : "Debes iniciar sesión para agregar productos"}
            >
              Agregar a mi orden
            </button>
          </div>

          {!usuario && (
            <p className="mt-2 text-sm text-red-600">
              Debes iniciar sesión para agregar productos al carrito.
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 text-2xl"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default DetalleProductoModal;



