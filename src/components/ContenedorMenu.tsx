import { useEffect, useState } from "react";
import SeccionMenu from "./SeccionMenu";
import DetalleProductoModal from "./DetalleProductoModal";
import { useProductos } from "../context/ProductosContext";
import { listarPromocionesVigentes } from "../services/promocionService";
import { listarInsumosVendibles } from "../services/insumoService";
import type { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import type { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

const ContenedorMenu = () => {
  const { productos } = useProductos();
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [insumosVendibles, setInsumosVendibles] = useState<ArticuloInsumo[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ArticuloMenu | null>(null);

  useEffect(() => {
    listarPromocionesVigentes()
      .then(setPromociones)
      .catch((error) => console.error("Error al obtener promociones:", error));
    listarInsumosVendibles()
      .then(setInsumosVendibles)
      .catch((error) => console.error("Error al obtener bebidas y otros:", error));
  }, []);

  const handleProductoClick = (producto: ArticuloMenu) => {
    setProductoSeleccionado(producto);
  };

  // Agrupamos los productos reales por su categoría (en vez de las secciones fijas del mock).
  // Las promociones van en su propia sección, primero, en vez de mezclarse por categoría.
  const secciones = new Map<string, ArticuloMenu[]>();
  if (promociones.length > 0) secciones.set("Promociones", promociones);
  // Los insumos que se venden directo (ej. gaseosas) van en la sección de su categoría,
  // junto a los platos de esa misma categoría.
  [...productos, ...insumosVendibles].forEach((producto) => {
    const nombreCategoria = producto.categoria?.denominacion || "Otros";
    if (!secciones.has(nombreCategoria)) secciones.set(nombreCategoria, []);
    secciones.get(nombreCategoria)!.push(producto);
  });

  return (
    <main className="px-4 py-6 md:px-16 scroll-smooth">
      <div className="w-full max-w-[1440px] mx-auto rounded-xl bg-white/70 backdrop-blur-md shadow-md p-6 flex gap-6">
        <div className="flex-1 space-y-10">
          {[...secciones.entries()].map(([nombreCategoria, items]) => (
            <div id={nombreCategoria.toLowerCase()} key={nombreCategoria}>
              <SeccionMenu
                titulo={nombreCategoria.toUpperCase()}
                productos={items}
                onProductoClick={handleProductoClick}
              />
            </div>
          ))}
          {productos.length === 0 && promociones.length === 0 && (
            <p className="text-center text-gray-600 py-10">
              Todavía no hay productos cargados en el menú.
            </p>
          )}
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
