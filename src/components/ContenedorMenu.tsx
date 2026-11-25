import { useEffect, useMemo, useRef, useState } from "react";
import CardMenu from "./CardMenu";
import DetalleProductoModal from "./DetalleProductoModal";
import { Modal } from "./Modal";
import { Paginador } from "./Paginador";
import { useProductos } from "../context/ProductosContext";
import { useCategoria } from "../context/CategoriaContext";
import { listarPromocionesVigentes } from "../services/promocionService";
import { listarInsumosVendibles } from "../services/insumoService";
import { obtenerLocal, urlComoLlegar, type Local } from "../services/localService";
import type { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import type { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

// Catálogo de venta (enunciado, historia #8, figuras 17 y 18): buscador, banner del 10% por
// retiro, menú de categorías con subcategorías, "Ordenar por" y una grilla paginada de tarjetas
// ("Sin stock" incluidas, deshabilitadas). Se filtra todo en el navegador: el menú completo ya
// viene en tres listas chicas (platos, bebidas/insumos vendibles y promociones).

type Orden = "predeterminado" | "precio-asc" | "precio-desc" | "nombre-asc" | "nombre-desc" | "tiempo-asc" | "tiempo-desc";

// Las mismas opciones que la figura 18.
const OPCIONES_ORDEN: { valor: Orden; etiqueta: string }[] = [
  { valor: "precio-asc", etiqueta: "Precio más bajo" },
  { valor: "precio-desc", etiqueta: "Precio más alto" },
  { valor: "nombre-asc", etiqueta: "A-Z" },
  { valor: "nombre-desc", etiqueta: "Z-A" },
  { valor: "tiempo-asc", etiqueta: "Menor tiempo" },
  { valor: "tiempo-desc", etiqueta: "Mayor tiempo" },
  { valor: "predeterminado", etiqueta: "Predeterminado" },
];

const POR_PAGINA = 9;

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

const ContenedorMenu = () => {
  const { productos } = useProductos();
  const { categorias } = useCategoria();
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [insumosVendibles, setInsumosVendibles] = useState<ArticuloInsumo[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ArticuloMenu | null>(null);
  const [local, setLocal] = useState<Local | null>(null);
  const [verDescuento, setVerDescuento] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>("predeterminado");
  const [seleccion, setSeleccion] = useState<Seleccion>({ tipo: "todas" });
  const [pagina, setPagina] = useState(0);
  const grillaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listarPromocionesVigentes()
      .then(setPromociones)
      .catch((error) => console.error("Error al obtener promociones:", error));
    listarInsumosVendibles()
      .then(setInsumosVendibles)
      .catch((error) => console.error("Error al obtener bebidas y otros:", error));
    obtenerLocal().then(setLocal).catch(() => setLocal(null));
  }, []);

  // Cualquier cambio de filtro u orden vuelve a la primera página.
  useEffect(() => {
    setPagina(0);
  }, [busqueda, orden, seleccion]);

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

  const etiquetasDe = (a: ArticuloMenu) => (esPromocion(a) ? ["Promoción"] : cadenaDe(a).map((id) => nombreCategoria(id, a)));

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
    return [a.denominacion, descripcionDe(a), ...etiquetasDe(a)].some((t) => normalizar(t).includes(texto));
  };

  const coincideSeleccion = (a: ArticuloMenu) => {
    if (seleccion.tipo === "todas") return true;
    if (seleccion.tipo === "promociones") return esPromocion(a);
    if (esPromocion(a)) return false;
    const cadena = cadenaDe(a);
    return cadena[0] === seleccion.raizId && (seleccion.subId == null || cadena.includes(seleccion.subId));
  };

  // Predeterminado: promociones primero y después cada categoría (en orden alfabético).
  const posicionPredeterminada = (a: ArticuloMenu) =>
    esPromocion(a) ? -1 : raices.findIndex(([id]) => id === cadenaDe(a)[0]);

  const comparar = (a: ArticuloMenu, b: ArticuloMenu) => {
    switch (orden) {
      case "precio-asc":
        return precioDe(a) - precioDe(b);
      case "precio-desc":
        return precioDe(b) - precioDe(a);
      case "nombre-asc":
        return a.denominacion.localeCompare(b.denominacion, "es");
      case "nombre-desc":
        return b.denominacion.localeCompare(a.denominacion, "es");
      case "tiempo-asc":
        return tiempoDe(a) - tiempoDe(b);
      case "tiempo-desc":
        return tiempoDe(b) - tiempoDe(a);
      default:
        return posicionPredeterminada(a) - posicionPredeterminada(b);
    }
  };

  const filtrados = [...promociones, ...articulos].filter((a) => coincideSeleccion(a) && coincideBusqueda(a)).sort(comparar);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  const irAPagina = (p: number) => {
    setPagina(p);
    grillaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    `shrink-0 px-4 py-2 rounded-full text-sm border transition select-none ${
      activo ? "bg-gray-300 border-gray-300 text-gray-900 font-semibold" : "bg-white border-gray-300 text-gray-700 hover:border-gray-500"
    }`;

  const raizSeleccionada = seleccion.tipo === "categoria" ? seleccion.raizId : null;
  const subcategorias = raizSeleccionada != null ? subcategoriasDe(raizSeleccionada) : [];
  const hayFiltro = seleccion.tipo !== "todas" || !!texto;

  return (
    <main className="px-4 py-8">
      <div className="w-full max-w-5xl mx-auto rounded-xl bg-white shadow-md p-5 sm:p-8">
        <h2 className="text-2xl text-gray-700">
          Encontrá las mejores ofertas <span className="font-semibold">en Mendoza</span>
        </h2>
        <p className="text-sm text-gray-500 mb-3">Lista de nuestras hamburguesas, pizzas, promociones y bebidas...</p>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            grillaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="flex gap-3 mb-6"
        >
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Por ejemplo, pizza, hamburguesa..."
            aria-label="Buscar por producto, categoría o palabra clave"
            className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm text-black focus:outline-none focus:border-amber-700"
          />
          <button type="submit" className="bg-gray-500 hover:bg-gray-600 text-white text-sm font-semibold px-6 sm:px-10 rounded-md">
            Buscar
          </button>
        </form>

        <div className="flex flex-col sm:flex-row items-stretch bg-gray-100 rounded-xl overflow-hidden mb-8 sm:h-36">
          <div className="flex-1 p-5">
            <p className="text-xl font-semibold text-gray-700">10% Descuento</p>
            <p className="text-sm text-gray-500 mb-3">Si retirás tu pedido en nuestro local</p>
            <button
              type="button"
              onClick={() => setVerDescuento(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold px-4 py-1.5 rounded-md"
            >
              Ver más
            </button>
          </div>
          <img src="/assets/img/hamburguesaInfo2.jpeg" alt="" className="sm:w-2/5 h-32 sm:h-full object-cover" />
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-xl text-gray-700">Categorías</h3>
          <label className="text-sm">
            <select
              aria-label="Ordenar por"
              value={orden}
              onChange={(e) => setOrden(e.target.value as Orden)}
              className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700"
            >
              <option value="predeterminado" disabled hidden>
                Ordenar por
              </option>
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
          className="flex gap-2 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing pb-1"
          aria-label="Categorías"
        >
          <button type="button" aria-pressed={seleccion.tipo === "todas"} onClick={() => elegir({ tipo: "todas" })} className={estiloChip(seleccion.tipo === "todas")}>
            Todos
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
          <div className="flex flex-wrap gap-2 mt-3" aria-label="Subcategorías">
            <button
              type="button"
              aria-pressed={seleccion.subId == null}
              onClick={() => setSeleccion({ ...seleccion, subId: null })}
              className={`${estiloChip(seleccion.subId == null)} !py-1 text-xs uppercase`}
            >
              Todos
            </button>
            {subcategorias.map(([id, nombre]) => (
              <button
                key={id}
                type="button"
                aria-pressed={seleccion.subId === id}
                onClick={() => setSeleccion({ ...seleccion, subId: id })}
                className={`${estiloChip(seleccion.subId === id)} !py-1 text-xs uppercase`}
              >
                {nombre}
              </button>
            ))}
          </div>
        )}

        <div ref={grillaRef} className="scroll-mt-28 mt-6">
          {texto && filtrados.length > 0 && (
            <p className="text-sm text-gray-600 mb-3">
              {filtrados.length} {filtrados.length === 1 ? "resultado" : "resultados"} para "{busqueda.trim()}"
            </p>
          )}

          {filtrados.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-6">
                {visibles.map((producto) => (
                  <CardMenu
                    key={producto.id}
                    producto={producto}
                    etiquetas={etiquetasDe(producto)}
                    onClick={() => setProductoSeleccionado(producto)}
                  />
                ))}
              </div>
              {totalPaginas > 1 && (
                <div className="mt-6">
                  <Paginador
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    totalElementos={filtrados.length}
                    tamanio={POR_PAGINA}
                    onCambiarPagina={irAPagina}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-700 mb-4">
                {hayFiltro
                  ? `No encontramos productos${texto ? ` para "${busqueda.trim()}"` : " en esta categoría"}.`
                  : "Todavía no hay productos cargados en el menú."}
              </p>
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
      </div>

      {productoSeleccionado && (
        <DetalleProductoModal producto={productoSeleccionado} onClose={() => setProductoSeleccionado(null)} visible={true} />
      )}

      <Modal isOpen={verDescuento} onClose={() => setVerDescuento(false)} titulo="10% de descuento retirando en el local">
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            Si elegís <span className="font-semibold">"En tienda"</span> en el carrito, se descuenta solo el 10% del total de tus
            productos. No hace falta ningún código.
          </p>
          {local && (
            <>
              <p>
                <span className="font-semibold">{local.nombre}</span>
                {local.direccion ? ` · ${local.direccion}` : ""}
              </p>
              <p>
                Horario: de {local.horarioApertura.slice(0, 5)} a {local.horarioCierre.slice(0, 5)} hs
                {local.abiertoAhora ? " (abierto ahora)" : " (ahora está cerrado)"}
              </p>
              {local.direccion && (
                <a
                  href={urlComoLlegar(local.direccion)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-amber-800 underline hover:text-amber-900"
                >
                  ¿Cómo llegar?
                </a>
              )}
            </>
          )}
        </div>
      </Modal>
    </main>
  );
};

export default ContenedorMenu;
