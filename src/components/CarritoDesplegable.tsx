import { FiShoppingCart, FiClock, FiMapPin } from "react-icons/fi";
import { MdDelete, MdAdd, MdRemove } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";
import { useState } from "react";
import { ModalFactura } from "./ModalFactura";
import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";

const obtenerPrecio = (item: ArticuloManufacturado | ArticuloInsumo | Promocion): number => {
  if ("precioPromocional" in item) {
    return item.precioPromocional;
  }
  return item.precioVenta;
};

const CarritoDesplegable = () => {
  const navigate = useNavigate();
  const [showFactura, setShowFactura] = useState(false);
  const [direccion, setDireccion] = useState("San Juan 456, Mendoza");
  const [editandoDireccion, setEditandoDireccion] = useState(false);

  const {
    productos,
    actualizarCantidad,
    eliminarProducto,
    subtotal,
    total,
    tipoEntrega,
    setTipoEntrega,
    deliveryCosto,
  } = useCarrito();

  const direccionActual =
    tipoEntrega === "tienda" ? "Córdoba 123, Ciudad, Mendoza" : direccion;

  return (
    <div className="fixed right-6 top-20 bg-white backdrop-blur-md rounded-xl p-6 w-[340px] h-[550px] shadow-lg text-black z-50 flex flex-col">
      {productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <FiShoppingCart className="text-4xl mb-4" />
          <p className="text-lg font-medium mb-6 text-center">
            Tu orden está vacía
          </p>
          <button
            onClick={() => navigate("/menupage")}
            className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-4 py-2 rounded-md"
          >
            ¡EMPEZAR A COMPRAR!
          </button>
        </div>
      ) : (
        <>
          {/* MI ORDEN */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-4">MI ORDEN</h2>
            <div className="max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
              {productos.map((prod) => (
                <div
                  key={prod.idUnico}
                  className="flex items-center justify-between mb-4"
                >
                  <img
                    src={`/assets/img/${prod.item.imagen}`}
                    alt={prod.item.denominacion}
                    className="w-14 h-14 rounded-md object-cover"
                  />
                  <div className="flex-1 mx-3">
                    <p className="text-sm font-semibold">
                      {prod.item.denominacion}
                    </p>
                    <p className="text-xs text-black-200">
                      ${obtenerPrecio(prod.item).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => actualizarCantidad(prod.idUnico, -1)}>
                      <MdRemove className="text-xl" />
                    </button>
                    <span>{prod.cantidad}</span>
                    <button onClick={() => actualizarCantidad(prod.idUnico, 1)}>
                      <MdAdd className="text-xl" />
                    </button>
                  </div>
                  <button
                    onClick={() => eliminarProducto(prod.idUnico)}
                    className="ml-2"
                  >
                    <MdDelete className="text-xl text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ENTREGA */}
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2">ENTREGA</h3>
            <div className="flex gap-3 mb-3">
              <button
                onClick={() => {
                  setTipoEntrega("tienda");
                  setEditandoDireccion(false);
                }}
                className={`px-3 py-1 rounded-full text-sm ${
                  tipoEntrega === "tienda" ? "bg-amber-700" : "bg-white/20"
                }`}
              >
                EN TIENDA
              </button>
              <button
                onClick={() => {
                  setTipoEntrega("delivery");
                  setEditandoDireccion(false);
                }}
                className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                  tipoEntrega === "delivery" ? "bg-amber-700" : "bg-white/20"
                }`}
              >
                <span className="text-lg">🛵</span> DELIVERY
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <FiClock />
              <span>
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiMapPin />
                {tipoEntrega === "delivery" && editandoDireccion ? (
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="border px-2 py-1 text-sm rounded-md"
                  />
                ) : (
                  <span className="text-sm">{direccionActual}</span>
                )}
              </div>
              {tipoEntrega === "delivery" && (
                <button
                  onClick={() => setEditandoDireccion(!editandoDireccion)}
                  className="text-sm border px-2 py-1 rounded-md"
                >
                  {editandoDireccion ? "GUARDAR" : "EDITAR"}
                </button>
              )}
            </div>
          </div>

          {/* RESUMEN Y ACCIONES */}
          <div className="mt-auto border-t border-white/30 pt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>SUBTOTAL:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>DELIVERY:</span>
              <span>${deliveryCosto.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-semibold mb-4">
              <span>TOTAL:</span>
              <span>${total.toLocaleString()}</span>
            </div>

            <button
              onClick={() => setShowFactura(true)}
              className="w-full bg-amber-700 text-white py-2 rounded-md font-bold text-sm mb-2"
            >
              CONTINUAR
            </button>

            {showFactura && (
              <ModalFactura
                onClose={() => setShowFactura(false)}
                direccion={direccionActual}
                handlePagoMercadoPago={() => {
                  throw new Error("Function not implemented.");
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CarritoDesplegable;

