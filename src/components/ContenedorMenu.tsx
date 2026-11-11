import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";
import SeccionMenu from "./SeccionMenu";
import DetalleProductoModal from "./DetalleProductoModal";
import { useProductos } from "../context/ProductosContext";
import { useCategoria } from "../context/CategoriaContext";
import { listarPromocionesVigentes } from "../services/promocionService";
import { listarInsumosVendibles } from "../services/insumoService";
import type { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import type { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

// Catálogo de venta (enunciado, historia #8): buscador, menú de categorías con subcategorías,
// "Ordenar por" y tarjetas "Sin stock". Todo se filtra en el navegador: el menú completo ya
// viene en tres listas chicas (platos, bebidas/insumos vendibles y promociones).

type Orden = "predeterminado" | "precio-asc" | "precio-desc" | "nombre" | "tiempo";

const OPCIONES_ORDEN: { valor: Orden; etiqueta: string }[] = [
  { valor: "predeterminado", etiqueta: "Predeterminado" },
  { valor: "precio-asc", etiqueta: "Precio: menor a mayor" },
  { valor: "precio-desc", etiqueta: "Precio: mayor a menor" },
  { valor: "nombre", etiqueta: "Nombre (A-Z)" },
  { valor: "tiempo", etiqueta: "Tiempo de preparación" },
];

type Seleccion =
  | { tipo: "todas" }
  | { tipo: "promociones" }
  | { tipo: "categoria"; raizId: number; subId: number | null };

const ID_SIN_CATEGORIA = -1;

const esPromocion = (a: ArticuloMenu): a is Promocion => "descripcionDescuento" in a;
const precioDe = (a: ArticuloMenu) => (esPromocion(a) ? a.precioPromocional : a.precioVenta);
const tiempoDe = (a: ArticuloMenu) => ("tiempoEstimado" in a ? a.tiempoEstimado : 0);
const descripcionDe = (a: ArticuloMenu) =>
  esPromocion(a) ? a.descripcionDescuento : "descripcion" in a ? a.descripcion : "";

// Sin tildes ni mayúsculas, para que "pizza" encuentre "Pizzas" y "jamon" encuentre "Jamón".
const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const comparar = (orden: Orden) => (a: ArticuloMenu, b: ArticuloMenu) => {
  switch (orden) {
    case "precio-asc":
      return precioDe(a) - precioDe(b);
    case "precio-desc":
      return precioDe(b) - precioDe(a);
    case "nombre":
      return a.denominacion.localeCompare(b.denominacion, "es");
    case "tiempo":
      return tiempoDe(a) - tiempoDe(b);
    default:
      return 0;
  }
};

const ContenedorMenu = () => {
  const { productos } = useProductos();
  const { categorias } = useCategoria();
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [insumosVendibles, setInsumosVendibles] = useState<ArticuloInsumo[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ArticuloMenu | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>("predeterminado");
  const [seleccion, setSeleccion] = useState<Seleccion>({ tipo: "todas" });

  useEffect(() => {
    listarPromocionesVigentes()
      .then(setPromociones)
      .catch((error) => console.error("Error al obtener promociones:", error));
    listarInsumosVendibles()
      .then(setInsumosVendibles)
      .catch((error) => console.error("Error al obtener bebidas y otros:", error));
  }, []);

  const articulos = useMemo<ArticuloMenu[]>(
    () => [...productos, ...insumosVendibles],
    [productos, insumosVendibles]
  );

  // Árbol de categorías: id -> {nombre, padre}. Las que vienen en el artículo pero no en la
  // lista general (ej. desactivadas) se toman como raíz con su propio nombre.
  const arbol = useMemo(() => {
    const mapa = new Map<number, { nombre: string; padreId: number | null }>();
    categorias.forEach((c) => {
      if (c.id != null) mapa.set(c.id, { nombre: c.denominacion, padreId: c.categoriaPadre?.id ?? null });
    });
    return mapa;
  }, [categorias]);

  // Cadena de categorías de un artículo, de la raíz a la suya: [raíz, sub, ...].
  const cadenaDe = (a: ArticuloMenu): number[] => {
    const id = esPromocion(a) ? undefined : a.categoria?.id;
    if (id == null) return [ID_SIN_CATEGORIA];
    const cadena: number[] = [];
    let actual: number | null = id;
    const vistos = new Set<number>();
    while (actual != null && !vistos.has(actual)) {
      vistos.add(actual);
      cadena.unshift(actual);
      actual = arbol.get(actual)?.padreId ?? null;
    }
    return cadena;
  };

  const nombreCategoria = (id: number, a?: ArticuloMenu) =>
    id === ID_SIN_CATEGORIA ? "Otros" : arbol.get(id)?.nombre ?? (a && !esPromocion(a) ? a.categoria?.denominacion : undefined) ?? "Otros";

  // Raíces y subcategorías que tienen al menos un artículo (no se muestran categorías vacías).
  const { raices, subcategoriasDe } = useMemo(() => {
    const raices = new Map<number, string>();
    const subs = new Map<number, Map<number, string>>();
    articulos.forEach((a) => {
      const [raiz, sub] = cadenaDe(a);
      raices.set(raiz, nombreCategoria(raiz, a));
      if (sub != null) {
        if (!subs.has(raiz)) subs.set(raiz, new Map());
        subs.get(raiz)!.set(sub, nombreCategoria(sub, a));
      }
    });
    const ordenarPorNombre = (m: Map<number, string>) =>
      [...m.entries()].sort((x, y) => x[1].localeCompare(y[1], "es"));
    return {
      raices: ordenarPorNombre(raices),
      subcategoriasDe: (raizId: number) => ordenarPorNombre(subs.get(raizId) ?? new Map()),
    };
    // cadenaDe/nombreCategoria dependen solo de "arbol"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articulos, arbol]);

  const texto = normalizar(busqueda);
  const coincideBusqueda = (a: ArticuloMenu) => {
    if (!texto) return true;
    const categoriasDelArticulo = esPromocion(a) ? ["promociones"] : cadenaDe(a).map((id) => nombreCategoria(id, a));
    return [a.denominacion, descripcionDe(a), ...categoriasDelArticulo].some((t) => normalizar(t).includes(texto));
  };

  const coincideSeleccion = (a: ArticuloMenu) => {
    if (seleccion.tipo === "todas") return true;
    if (seleccion.tipo === "promociones") return esPromocion(a);
    if (esPromocion(a)) return false;
    const cadena = cadenaDe(a);
    return cadena[0] === seleccion.raizId && (seleccion.subId == null || cadena.includes(seleccion.subId));
  };

  const todos: ArticuloMenu[] = [...promociones, ...articulos];
  const filtrados = todos.filter((a) => coincideSeleccion(a) && coincideBusqueda(a)).sort(comparar(orden));

  // Sin filtro ni búsqueda: secciones (Promociones primero, después cada categoría raíz).
  const mostrarSecciones = seleccion.tipo === "todas" && !texto;
  const secciones = new Map<string, ArticuloMenu[]>();
  if (mostrarSecciones) {
    const promos = filtrados.filter(esPromocion);
    if (promos.length > 0) secciones.set("Promociones", promos);
    raices.forEach(([raizId, nombre]) => {
      const items = filtrados.filter((a) => !esPromocion(a) && cadenaDe(a)[0] === raizId);
      if (items.length > 0) secciones.set(nombre, items);
    });
  }

  const tituloResultados = (() => {
    if (texto) return `Resultados para "${busqueda.trim()}"`;
    if (seleccion.tipo === "promociones") return "Promociones";
    if (seleccion.tipo === "categoria") {
      const raiz = raices.find(([id]) => id === seleccion.raizId)?.[1] ?? "";
      const sub = seleccion.subId != null ? subcategoriasDe(seleccion.raizId).find(([id]) => id === seleccion.subId)?.[1] : null;
      return sub ? `${raiz} · ${sub}` : raiz;
    }
    return "";
  })();

  // Menú de categorías: además del scroll normal, se puede arrastrar con el mouse (enunciado,
  // criterio 3). Si hubo arrastre, el clic que lo termina no cuenta como selección.
  const barraRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef({ activo: false, inicioX: 0, scrollInicial: 0, movido: false });
  const alPresionar = (e: React.MouseEvent) => {
    if (!barraRef.current) return;
    arrastre.current = { activo: true, inicioX: e.pageX, scrollInicial: barraRef.current.scrollLeft, movido: false };
  };
  const alMover = (e: React.MouseEvent) => {
    const estado = arrastre.current;
    if (!estado.activo || !barraRef.current) return;
    const dx = e.pageX - estado.inicioX;
    if (Math.abs(dx) > 5) estado.movido = true;
    barraRef.current.scrollLeft = estado.scrollInicial - dx;
  };
  const alSoltar = () => {
    arrastre.current.activo = false;
  };
  const elegir = (nueva: Seleccion) => {
    if (arrastre.current.movido) return;
    setSeleccion(nueva);
  };

  const estiloChip = (activo: boolean) =>
    `shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition select-none ${
      activo ? "bg-amber-700 border-amber-700 text-white" : "bg-white border-gray-300 text-gray-800 hover:border-amber-700"
    }`;

  const raizSeleccionada = seleccion.tipo === "categoria" ? seleccion.raizId : null;
  const subcategorias = raizSeleccionada != null ? subcategoriasDe(raizSeleccionada) : [];
  const hayFiltro = seleccion.tipo !== "todas" || !!texto;

  return (
    <div className="flex flex-col gap-2">
      <div className="mx-auto w-full max-w-6xl rounded-xl bg-white/80 backdrop-blur-md shadow-md mt-6 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-1 items-center bg-white border border-gray-300 rounded-full overflow-hidden focus-within:border-amber-700"
          >
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscá por producto, categoría o palabra clave"
              aria-label="Buscar en el menú"
              className="flex-1 px-4 py-2 text-sm text-black outline-none bg-transparent"
            />
            <button type="submit" aria-label="Buscar" className="px-4 py-2 text-gray-600 hover:text-amber-700">
              <FiSearch />
            </button>
          </form>
          <label className="flex items-center gap-2 text-sm text-gray-800">
            <span className="font-semibold whitespace-nowrap">Ordenar por</span>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white text-black"
            >
              {OPCIONES_ORDEN.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          ref={barraRef}
          onMouseDown={alPresionar}
          onMouseMove={alMover}
          onMouseUp={alSoltar}
          onMouseLeave={alSoltar}
          className="flex gap-2 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
          aria-label="Categorías"
        >
          <button type="button" aria-pressed={seleccion.tipo === "todas"} onClick={() => elegir({ tipo: "todas" })} className={estiloChip(seleccion.tipo === "todas")}>
            Todas
          </button>
          {promociones.length > 0 && (
            <button
              type="button"
              aria-pressed={seleccion.tipo === "promociones"}
              onClick={() => elegir({ tipo: "promociones" })}
              className={estiloChip(seleccion.tipo === "promociones")}
            >
              Promociones
            </button>
          )}
          {raices.map(([id, nombre]) => (
            <button
              key={id}
              type="button"
              aria-pressed={raizSeleccionada === id}
              onClick={() => elegir({ tipo: "categoria", raizId: id, subId: null })}
              className={estiloChip(raizSeleccionada === id)}
            >
              {nombre}
            </button>
          ))}
        </div>

        {seleccion.tipo === "categoria" && subcategorias.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-1" aria-label="Subcategorías">
            <button
              type="button"
              aria-pressed={seleccion.subId == null}
              onClick={() => setSeleccion({ ...seleccion, subId: null })}
              className={`${estiloChip(seleccion.subId == null)} !py-1 text-xs`}
            >
              Todo {raices.find(([id]) => id === seleccion.raizId)?.[1]}
            </button>
            {subcategorias.map(([id, nombre]) => (
              <button
                key={id}
                type="button"
                aria-pressed={seleccion.subId === id}
                onClick={() => setSeleccion({ ...seleccion, subId: id })}
                className={`${estiloChip(seleccion.subId === id)} !py-1 text-xs`}
              >
                {nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-y-scroll scrollbar-hide h-[600px]">
        <main className="px-4 py-6 md:px-16 scroll-smooth">
          <div className="w-full max-w-[1440px] mx-auto rounded-xl bg-white/70 backdrop-blur-md shadow-md p-6">
            {mostrarSecciones ? (
              <div className="space-y-10">
                {[...secciones.entries()].map(([nombre, items]) => (
                  <SeccionMenu key={nombre} titulo={nombre.toUpperCase()} productos={items} onProductoClick={setProductoSeleccionado} />
                ))}
                {secciones.size === 0 && (
                  <p className="text-center text-gray-600 py-10">Todavía no hay productos cargados en el menú.</p>
                )}
              </div>
            ) : filtrados.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  {filtrados.length} {filtrados.length === 1 ? "producto" : "productos"}
                </p>
                <SeccionMenu titulo={tituloResultados.toUpperCase()} productos={filtrados} onProductoClick={setProductoSeleccionado} />
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-700 mb-4">No encontramos productos{texto ? ` para "${busqueda.trim()}"` : " en esta categoría"}.</p>
                {hayFiltro && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda("");
                      setSeleccion({ tipo: "todas" });
                    }}
                    className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-4 py-2 rounded-md"
                  >
                    Ver todo el menú
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {productoSeleccionado && (
        <DetalleProductoModal producto={productoSeleccionado} onClose={() => setProductoSeleccionado(null)} visible={true} />
      )}
    </div>
  );
};

export default ContenedorMenu;
