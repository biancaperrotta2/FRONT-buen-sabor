import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";
import CardMenu from "./CardMenu";

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

interface Props {
  titulo: string;
  productos: ArticuloMenu[];
  onProductoClick: (producto: ArticuloMenu) => void;
}

const SeccionMenu = ({ titulo, productos, onProductoClick }: Props) => {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-800 mb-4">{titulo}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {productos.map((producto) => (
          <div
            key={producto.id}
            onClick={() => onProductoClick(producto)}
            className="cursor-pointer"
          >
            <CardMenu producto={producto} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default SeccionMenu;

