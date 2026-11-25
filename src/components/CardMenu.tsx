import { useState } from "react";
import { urlDeImagen } from "../utils/imagen";
import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

interface Props {
  producto: ArticuloMenu;
  // Categoría (y subcategoría) que se muestra debajo del precio, como las etiquetas de la figura 17.
  etiquetas?: string[];
  onClick?: () => void;
}

// Tarjeta del catálogo (figura 17): foto arriba con el tiempo de preparación encima, título,
// precio y etiquetas. Sin stock: gris, con la etiqueta "SIN STOCK" y sin abrir el detalle.
const CardMenu = ({ producto, etiquetas = [], onClick }: Props) => {
  let precio = 0;
  let imagen: string | null | undefined = null;
  // Solo los platos tienen tiempo de preparación (una bebida o una promo no lo informan).
  let tiempo = 0;

  if ("descripcionDescuento" in producto) {
    precio = producto.precioPromocional;
    imagen = producto.imagen || null;
  } else if ("descripcion" in producto) {
    precio = producto.precioVenta;
    imagen = producto.imagen;
    tiempo = producto.tiempoEstimado;
  } else {
    precio = producto.precioVenta;
    imagen = producto.imagen;
  }

  const denominacion = producto.denominacion;
  const sinStock = producto.disponible === false;
  const [imagenRota, setImagenRota] = useState(false);
  const urlImagen = imagenRota ? null : urlDeImagen(imagen);

  const contenido = (
    <>
      <div className="relative h-40 bg-gray-200 rounded-xl overflow-hidden">
        {urlImagen && (
          <img
            src={urlImagen}
            alt=""
            onError={() => setImagenRota(true)}
            className="w-full h-full object-cover"
          />
        )}
        {tiempo > 0 && (
          <span className="absolute bottom-0 left-0 bg-white/90 text-gray-700 text-xs rounded-tr-xl px-3 py-1">
            {tiempo} min
          </span>
        )}
        {sinStock && (
          <span className="absolute top-3 right-0 bg-gray-500 text-white text-[10px] font-bold tracking-wide px-3 py-1">
            SIN STOCK
          </span>
        )}
      </div>
      <div className="px-1 pt-2">
        <p className="text-gray-800 font-semibold leading-tight">{denominacion}</p>
        <p className="text-sm">
          <span className="font-semibold text-gray-800">${precio.toLocaleString("es-AR")}</span>
          {etiquetas.length > 0 && <span className="text-gray-500 ml-2">{etiquetas.join(" · ")}</span>}
        </p>
      </div>
    </>
  );

  // Botón real (accesible con teclado) salvo que no tenga stock, que queda como tarjeta inerte.
  return sinStock ? (
    <div aria-disabled="true" aria-label={`${denominacion}, sin stock`} className="opacity-50 grayscale cursor-not-allowed">
      {contenido}
    </div>
  ) : (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalle de ${denominacion}`}
      className="block w-full text-left rounded-xl transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
    >
      {contenido}
    </button>
  );
};

export default CardMenu;
