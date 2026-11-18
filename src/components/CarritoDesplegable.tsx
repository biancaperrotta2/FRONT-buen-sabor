import { FiShoppingCart, FiClock, FiMapPin } from "react-icons/fi";
import { MdAdd, MdRemove, MdStorefront, MdDeliveryDining } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";
import { useEffect, useState } from "react";
import { ModalFactura } from "./ModalFactura";
import CambiarDireccionModal from "./CambiarDireccionModal";
import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";
import { urlDeImagen } from "../utils/imagen";
import { estimarHora, misDomicilios } from "../services/pedidoService";
import { obtenerLocal, urlComoLlegar, type Local } from "../services/localService";

const obtenerPrecio = (item: ArticuloManufacturado | ArticuloInsumo | Promocion): number => {
  if ("precioPromocional" in item) {
    return item.precioPromocional;
  }
  return item.precioVenta;
};

const pesos = (monto: number) => `$${monto.toLocaleString("es-AR")}`;

// Carrito de compras (figura 20 del enunciado): ítems con +/-, forma de entrega, hora estimada,
// dirección (con "Cambiar") o "¿Cómo llegar?" al local, totales, "Continuar" y "Cancelar el pedido".
const CarritoDesplegable = () => {
  const navigate = useNavigate();
  const [showFactura, setShowFactura] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [cambiandoDireccion, setCambiandoDireccion] = useState(false);
  const [horaEstimada, setHoraEstimada] = useState<string | null>(null);
  const [local, setLocal] = useState<Local | null>(null);

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

  useEffect(() => {
    obtenerLocal().then(setLocal).catch(() => setLocal(null));
  }, []);

  // Con delivery y sin dirección elegida todavía, se toma la primera guardada (el cliente la
  // cambia con "Cambiar"). Sin direcciones guardadas, el botón abre el formulario para agregar.
  useEffect(() => {
    if (tipoEntrega !== "delivery" || domicilioSeleccionado) return;
    misDomicilios()
      .then((lista) => {
        if (lista.length > 0) setDomicilioSeleccionado(lista[0]);
      })
      .catch(() => {});
  }, [tipoEntrega, domicilioSeleccionado, setDomicilioSeleccionado]);

  // Hora estimada con la fórmula del enunciado (la calcula el backend para lo que hay en el
  // carrito); se recalcula al cambiar productos, cantidades o forma de entrega.
  const firmaCarrito = productos.map((p) => `${p.item.id}x${p.cantidad}`).join(",") + "|" + tipoEntrega;
  useEffect(() => {
    if (productos.length === 0) {
      setHoraEstimada(null);
      return;
    }
    const temporizador = setTimeout(() => {
      estimarHora(
        tipoEntrega === "delivery" ? "DELIVERY" : "TAKE_AWAY",
        productos.map((p) => ({ idArticulo: Number(p.item.id), cantidad: p.cantidad }))
      )
        .then((r) => setHoraEstimada(r.horaEstimada.slice(0, 5)))
        .catch(() => setHoraEstimada(null));
    }, 300);
    return () => clearTimeout(temporizador);
    // firmaCarrito resume productos y tipoEntrega
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaCarrito]);

  const estiloEntrega = (activo: boolean) =>
    `flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-sm border transition ${
      activo ? "border-gray-800 text-gray-900 font-semibold" : "border-gray-300 text-gray-400 hover:text-gray-600"
    }`;

  return (
    <div className="fixed right-6 top-20 bg-gray-50 rounded-xl p-6 w-[340px] max-w-[calc(100vw-2rem)] h-[560px] shadow-lg text-black z-50 flex flex-col">
      {/* Fuera de la rama vacío/con-productos: crear el pedido vacía el carrito, y si el
          modal viviera adentro de esa rama se desmontaría a mitad de la confirmación. */}
      {showFactura && <ModalFactura onClose={() => setShowFactura(false)} />}
      {cambiandoDireccion && (
        <CambiarDireccionModal
          actual={domicilioSeleccionado}
          onGuardar={setDomicilioSeleccionado}
          onClose={() => setCambiandoDireccion(false)}
        />
      )}

      {/* Confirmación dentro del propio panel. */}
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
              Sí, cancelar pedido
            </button>
            <button
              onClick={() => setConfirmarCancelacion(false)}
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-md font-bold text-sm"
            >
              Seguir comprando
            </button>
          </div>
        </div>
      )}

      {productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <FiShoppingCart className="text-4xl mb-4 text-gray-500" aria-hidden="true" />
          <p className="text-lg text-gray-600 mb-4 text-center">Tu orden está vacía</p>
          <button
            onClick={() => navigate("/menupage")}
            className="bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-md"
          >
            ¡Empezar a comprar!
          </button>
        </div>
      ) : (
        <>
          {/* Ítems y entrega scrollean acá adentro; el resumen de abajo queda siempre fijo. */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Mi Orden</h2>
            <div className="space-y-3 mb-5">
              {productos.map((prod) => (
                <div key={prod.idUnico} className="flex items-center gap-3">
                  {urlDeImagen(prod.item.imagen) ? (
                    <img
                      src={urlDeImagen(prod.item.imagen)!}
                      alt=""
                      onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                      className="w-12 h-12 rounded-md object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-gray-200 shrink-0" aria-hidden="true" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{prod.item.denominacion}</p>
                    <p className="text-xs text-gray-500">{pesos(obtenerPrecio(prod.item))}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => actualizarCantidad(prod.idUnico, -1)}
                        aria-label={`Restar una unidad de ${prod.item.denominacion}`}
                        className="text-gray-600 hover:text-black"
                      >
                        <MdRemove />
                      </button>
                      <span aria-label="Cantidad">{prod.cantidad}</span>
                      <button
                        onClick={() => actualizarCantidad(prod.idUnico, 1)}
                        aria-label={`Sumar una unidad de ${prod.item.denominacion}`}
                        className="text-gray-600 hover:text-black"
                      >
                        <MdAdd />
                      </button>
                    </div>
                    <button
                      onClick={() => eliminarProducto(prod.idUnico)}
                      className="text-xs text-gray-600 border border-gray-400 rounded px-2 py-0.5 hover:bg-gray-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mb-2">Entrega</h3>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setTipoEntrega("tienda")} aria-pressed={tipoEntrega === "tienda"} className={estiloEntrega(tipoEntrega === "tienda")}>
                <MdStorefront aria-hidden="true" /> En tienda
              </button>
              <button onClick={() => setTipoEntrega("delivery")} aria-pressed={tipoEntrega === "delivery"} className={estiloEntrega(tipoEntrega === "delivery")}>
                <MdDeliveryDining aria-hidden="true" /> Delivery
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center shrink-0" aria-hidden="true">
                <FiClock />
              </span>
              <span className="text-sm text-gray-800">
                {horaEstimada ? `${horaEstimada} hs (estimado)` : "Calculando hora..."}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center shrink-0" aria-hidden="true">
                <FiMapPin />
              </span>
              {tipoEntrega === "tienda" ? (
                <div className="text-sm">
                  <p className="text-gray-800">¡Retirá en la tienda!</p>
                  {local?.direccion && (
                    <a
                      href={urlComoLlegar(local.direccion)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 underline hover:text-gray-800"
                    >
                      ¿Cómo llegar?
                    </a>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0 text-sm">
                    {domicilioSeleccionado ? (
                      <>
                        <p className="text-gray-800 truncate">
                          {domicilioSeleccionado.alias || `${domicilioSeleccionado.calle} ${domicilioSeleccionado.numero}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {deliveryCosto === null ? "Envío a confirmar" : pesos(deliveryCosto)}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">Agregá una dirección de envío</p>
                    )}
                  </div>
                  <button
                    onClick={() => setCambiandoDireccion(true)}
                    className="text-xs text-gray-700 border border-gray-400 rounded px-2 py-0.5 hover:bg-gray-100 shrink-0"
                  >
                    {domicilioSeleccionado ? "Cambiar" : "Agregar"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RESUMEN Y ACCIONES */}
          <div className="mt-auto pt-4">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Subtotal:</span>
              <span>{pesos(subtotal)}</span>
            </div>
            {tipoEntrega === "tienda" && descuentoRetiro > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>10% OFF Retiro en tienda</span>
                <span>-{pesos(descuentoRetiro)}</span>
              </div>
            )}
            {tipoEntrega === "delivery" && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Delivery</span>
                <span>{deliveryCosto === null ? "A confirmar" : `+ ${pesos(deliveryCosto)}`}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold mt-1 mb-3">
              <span>Total:</span>
              <span>{pesos(total)}</span>
            </div>

            <button
              onClick={() => setShowFactura(true)}
              className="w-full border border-gray-500 text-gray-800 py-2 rounded-full font-semibold hover:bg-gray-100"
            >
              Continuar
            </button>
            <button
              onClick={() => setConfirmarCancelacion(true)}
              className="w-full text-xs text-gray-500 hover:text-gray-800 mt-2"
            >
              Cancelar el pedido
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CarritoDesplegable;
