import { useState } from "react";
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

  if ("descripcionDescuento" in producto) {
    descripcion = producto.descripcionDescuento;
    precio = producto.precioPromocional;
    imagen = producto.imagen || null;
  } else if ("descripcion" in producto) {
    descripcion = producto.descripcion;
    precio = producto.precioVenta;
    imagen = producto.imagen;
  } else if ("esParaElaborar" in producto) {
    descripcion = producto.esParaElaborar
      ? "Insumo para elaboración"
      : "Producto directo al consumidor";
    precio = producto.precioVenta;
    imagen = producto.imagen;
  }

  const denominacion = producto.denominacion;
  const [imagenRota, setImagenRota] = useState(false);
  const urlImagen = imagenRota ? null : urlDeImagen(imagen);

  return (
    <div
      onClick={onClick}
      className="bg-zinc-900 rounded-lg shadow-lg w-full max-w-[460px] h-[160px] flex overflow-hidden cursor-pointer hover:scale-[1.01] transition"
    >
      <div className={`flex flex-col justify-between p-4 ${urlImagen ? "w-[75%]" : "w-full"}`}>
        <div>
          <span className="text-white font-bold text-sm block mb-1 uppercase tracking-wide">
            {denominacion}
          </span>
          <p className="text-gray-300 text-xs leading-tight">{descripcion}</p>
        </div>
        <span className="text-yellow-400 text-sm font-bold">${precio}</span>
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
