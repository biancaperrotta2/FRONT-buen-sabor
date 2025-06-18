import SeccionMenu from "./SeccionMenu";
import { hamburguesa, papa, agregado } from "../data/ArticuloManufacturado";
import { bebida, cerveza } from "../data/ArticuloInsumo";
import { promo1, promo2, promo3 } from "../data/Promociones";
import DetalleProductoModal from "./DetalleProductoModal";
import { useState } from "react";
import type { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import type { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import type { Promocion } from "../classes/PromocionClass";

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

const ContenedorMenu = () => {
  const [productoSeleccionado, setProductoSeleccionado] = useState<ArticuloMenu | null>(null);

  const handleProductoClick = (producto: ArticuloMenu) => {
    setProductoSeleccionado(producto);
  };

  const handleAgregar = (producto: ArticuloMenu, cantidad: number) => {
    console.log("Agregar al pedido:", producto, cantidad);
    setProductoSeleccionado(null);
  };

  const promociones: Promocion[] = [promo1, promo2, promo3];

  return (
    <main className="px-4 py-6 md:px-16 scroll-smooth">
      <div className="w-full max-w-[1440px] mx-auto rounded-xl bg-white/70 backdrop-blur-md shadow-md p-6 flex gap-6">
        <div className="flex-1 space-y-10">
          <div id="combos">
            <SeccionMenu titulo="COMBOS" productos={promociones} onProductoClick={handleProductoClick} />
          </div>
          <div id="hamburguesas">
            <SeccionMenu titulo="HAMBURGUESAS" productos={hamburguesa} onProductoClick={handleProductoClick} />
          </div>
          <div id="agregados">
            <SeccionMenu titulo="AGREGADOS" productos={agregado} onProductoClick={handleProductoClick} />
          </div>
          <div id="papas">
            <SeccionMenu titulo="PAPAS" productos={papa} onProductoClick={handleProductoClick} />
          </div>
          <div id="bebidas">
            <SeccionMenu titulo="BEBIDAS" productos={bebida} onProductoClick={handleProductoClick} />
          </div>
          <div id="cervezas">
            <SeccionMenu titulo="CERVEZAS" productos={cerveza} onProductoClick={handleProductoClick} />
          </div>
        </div>
      </div>
      {productoSeleccionado && (
        <DetalleProductoModal
          producto={productoSeleccionado}
          onClose={() => setProductoSeleccionado(null)}
          visible={true}
        />
      )}
    </main>
  );
};

export default ContenedorMenu;

