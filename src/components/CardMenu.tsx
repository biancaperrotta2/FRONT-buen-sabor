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
  let imagen = "default.jpg";

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

  const denominacion = producto.denominacion;

  return (
    <div
      onClick={onClick}
      className="bg-zinc-900 rounded-lg shadow-lg w-full max-w-[460px] h-[160px] flex overflow-hidden cursor-pointer hover:scale-[1.01] transition"
    >
      <div className="flex flex-col justify-between p-4 w-[75%]">
        <div>
          <span className="text-white font-bold text-sm block mb-1 uppercase tracking-wide">
            {denominacion}
          </span>
          <p className="text-gray-300 text-xs leading-tight">{descripcion}</p>
        </div>
        <span className="text-yellow-400 text-sm font-bold">${precio}</span>
      </div>
      <div className="w-[45%] h-full">
        <img
          src={`/assets/img/${imagen}`}
          alt={`Imagen de ${denominacion}`}
          className="w-full h-40 object-cover rounded-t-xl"
        />
      </div>
    </div>
  );
};

export default CardMenu;
