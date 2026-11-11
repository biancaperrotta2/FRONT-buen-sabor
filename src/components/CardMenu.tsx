import { useState } from "react";
import { FiClock } from "react-icons/fi";
import { urlDeImagen } from "../utils/imagen";
import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

interface Props {
  producto: ArticuloMenu;
  onClick?: () => void;
}

const CardMenu = ({ producto, onClick }: Props) => {
  let descripcion = "";
  let precio = 0;
  let imagen: string | null | undefined = null;
  // Solo los platos tienen tiempo de preparación (una bebida o una promo no lo informan).
  let tiempo = 0;

  if ("descripcionDescuento" in producto) {
    descripcion = producto.descripcionDescuento;
    precio = producto.precioPromocional;
    imagen = producto.imagen || null;
  } else if ("descripcion" in producto) {
    descripcion = producto.descripcion;
    precio = producto.precioVenta;
    imagen = producto.imagen;
    tiempo = producto.tiempoEstimado;
  } else if ("esParaElaborar" in producto) {
    descripcion = producto.esParaElaborar
      ? "Insumo para elaboración"
      : "Producto directo al consumidor";
    precio = producto.precioVenta;
    imagen = producto.imagen;
  }

  const denominacion = producto.denominacion;
  const sinStock = producto.disponible === false;
  const [imagenRota, setImagenRota] = useState(false);
  const urlImagen = imagenRota ? null : urlDeImagen(imagen);

  return (
    <div
      onClick={sinStock ? undefined : onClick}
      aria-disabled={sinStock || undefined}
      className={`relative bg-zinc-900 rounded-lg shadow-lg w-full max-w-[460px] h-[160px] flex overflow-hidden transition ${
        sinStock ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer hover:scale-[1.01]"
      }`}
    >
      {sinStock && (
        <span className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
          Sin stock
        </span>
      )}
      <div className={`flex flex-col justify-between p-4 ${urlImagen ? "w-[75%]" : "w-full"}`}>
        <div>
          <span className="text-white font-bold text-sm block mb-1 uppercase tracking-wide">
            {denominacion}
          </span>
          <p className="text-gray-300 text-xs leading-tight">{descripcion}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-yellow-400 text-sm font-bold">${precio.toLocaleString("es-AR")}</span>
          {tiempo > 0 && (
            <span className="text-gray-300 text-xs flex items-center gap-1">
              <FiClock aria-hidden="true" /> {tiempo} min
            </span>
          )}
        </div>
      </div>
      {urlImagen && (
        <div className="w-[45%] h-full">
          <img
            src={urlImagen}
            alt={`Imagen de ${denominacion}`}
            onError={() => setImagenRota(true)}
            className="w-full h-40 object-cover rounded-t-xl"
          />
        </div>
      )}
    </div>
  );
};

export default CardMenu;
