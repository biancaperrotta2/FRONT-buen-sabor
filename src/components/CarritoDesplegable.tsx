import { FiShoppingCart, FiClock, FiMapPin } from "react-icons/fi";
import { MdDelete, MdAdd, MdRemove } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";
import { useState } from "react";
import { ModalFactura } from "./ModalFactura";
import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";
import { urlDeImagen } from "../utils/imagen";
import SelectorDomicilio from "./SelectorDomicilio";

const obtenerPrecio = (item: ArticuloManufacturado | ArticuloInsumo | Promocion): number => {
  if ("precioPromocional" in item) {
    return item.precioPromocional;
  }
  return item.precioVenta;
};

const CarritoDesplegable = () => {
  const navigate = useNavigate();
  const [showFactura, setShowFactura] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);

  const {
    productos,
    actualizarCantidad,
    eliminarProducto,
    vaciarCarrito,
    subtotal,
    total,
    tipoEntrega,
    setTipoEntrega,
    deliveryCosto,
    descuentoRetiro,
    domicilioSeleccionado,
    setDomicilioSeleccionado,
  } = useCarrito();

  return (
    <div className="fixed right-6 top-20 bg-white backdrop-blur-md rounded-xl p-6 w-[340px] h-[550px] shadow-lg text-black z-50 flex flex-col">
      {/* Fuera de la rama vacío/con-productos: crear el pedido vacía el carrito, y si el
          modal viviera adentro de esa rama se desmontaría a mitad de la confirmación. */}
      {showFactura && <ModalFactura onClose={() => setShowFactura(false)} />}

      {/* Confirmación dentro del propio panel: el backdrop-blur del panel hace que un modal
          "fixed" hijo quede encerrado en él, así que se superpone al panel en vez de a la página. */}
      {confirmarCancelacion && (
        <div
          className="absolute inset-0 z-10 bg-white/95 rounded-xl flex flex-col items-center justify-center p-6 text-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-cancelar-pedido"
        >
          <p id="titulo-cancelar-pedido" className="text-lg font-semibold mb-2">
            ¿Vaciar tu orden?
          </p>
          <p className="text-sm text-gray-600 mb-6">Se van a quitar todos los productos del carrito.</p>
          <div className="w-full space-y-2">
            <button
              onClick={() => {
                vaciarCarrito();
                setConfirmarCancelacion(false);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md font-bold text-sm"
            >
              SÍ, CANCELAR PEDIDO
            </button>
            <button
              onClick={() => setConfirmarCancelacion(false)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-md font-bold text-sm"
            >
              SEGUIR COMPRANDO
            </button>
          </div>
        </div>
      )}

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
          {/* Todo lo que puede crecer (ítems + selector de dirección) scrollea acá adentro;
              el resumen de abajo queda siempre fijo y visible gracias al mt-auto. */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
          {/* MI ORDEN */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-4">MI ORDEN</h2>
            <div className="pr-1">
              {productos.map((prod) => (
                <div
                  key={prod.idUnico}
                  className="flex items-center justify-between mb-4"
                >
                  {urlDeImagen(prod.item.imagen) && (
                    <img
                      src={urlDeImagen(prod.item.imagen)!}
                      alt={prod.item.denominacion}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                      className="w-14 h-14 rounded-md object-cover"
                    />
                  )}
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
                onClick={() => setTipoEntrega("tienda")}
                className={`px-3 py-1 rounded-full text-sm ${
                  tipoEntrega === "tienda" ? "bg-amber-700" : "bg-white/20"
                }`}
              >
                EN TIENDA
              </button>
              <button
                onClick={() => setTipoEntrega("delivery")}
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

            {tipoEntrega === "tienda" ? (
              <div className="flex items-center gap-2">
                <FiMapPin />
                <span className="text-sm">Retirás en el local</span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <FiMapPin className="mt-1 shrink-0" />
                <div className="flex-1 text-black">
                  <SelectorDomicilio
                    seleccionado={domicilioSeleccionado}
                    onSeleccionar={setDomicilioSeleccionado}
                  />
                </div>
              </div>
            )}
          </div>
          </div>

          {/* RESUMEN Y ACCIONES */}
          <div className="mt-auto border-t border-white/30 pt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>SUBTOTAL:</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            {tipoEntrega === "tienda" && descuentoRetiro > 0 && (
              <div className="flex justify-between text-sm mb-1 text-green-700">
                <span>DESCUENTO RETIRO (10%):</span>
                <span>-${descuentoRetiro.toLocaleString()}</span>
              </div>
            )}
            {tipoEntrega === "delivery" && (
              <div className="flex justify-between text-sm mb-1">
                <span>DELIVERY:</span>
                <span>{deliveryCosto === null ? "A confirmar" : `$${deliveryCosto.toLocaleString()}`}</span>
              </div>
            )}
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
            <button
              onClick={() => setConfirmarCancelacion(true)}
              className="w-full border border-red-600 text-red-600 hover:bg-red-50 py-2 rounded-md font-bold text-sm mb-2"
            >
              CANCELAR PEDIDO
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CarritoDesplegable;

