import type { FormEvent } from "react";
import { useState } from "react";
import { UnidadMedida } from "../classes/UnidadMedidaClass";
import type { Categoria } from "../classes/CategoriaClass";
import type { InsumoDto } from "../pages/Insumo";
import Modal from "./Modal";
import { FormularioUnidadMedida } from "./FormularioUnidadMedida";
import { useCategoria } from "../context/CategoriaContext";
import type { CategoriaDto } from "../pages/Categorias";
import InputNumerico from "./InputNumerico";
import { convertirCantidad, factorDeUnidad } from "../utils/unidades";
import { urlDeImagen } from "../utils/imagen";
import { TAMANIO_MAXIMO_IMAGEN_MB, TIPOS_IMAGEN_PERMITIDOS } from "../services/imagenService";

const CLASE_INPUT =
  "border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400";

// El stock se guarda siempre en la unidad base (Kilos/Litros/Unidad), pero el admin lo tipea
// y lo ve en la unidad que el insumo tiene elegida. Sin convertir, cambiar de Kilos a Gramos
// sin retocar el número reinterpretaría el mismo valor como 1000 veces más stock del real.
const factorDe = (unidad: UnidadMedida | null) => factorDeUnidad(unidad?.denominacion);

export interface InsumoRecord {
  denominacion: string;
  precioVenta: number;
  precioCompra: number;
  margen: number | null;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  esParaElaborar: boolean;
  unidadMedida: UnidadMedida;
  imagenUrl: string | null;
  categoria: CategoriaDto;
}

interface Props {
  modoEdicion: boolean;
  setModoEdicion: (value: boolean) => void;
  denominacion: string;
  setDenominacion: (value: string) => void;
  precioCompra: number | "";
  setPrecioCompra: (value: number | "") => void;
  precioVenta: number | "";
  setPrecioVenta: (value: number | "") => void;
  margen: number | "";
  setMargen: (value: number | "") => void;
  stockActual: number | "";
  setStockActual: (value: number | "") => void;
  stockMinimo: number | "";
  setStockMinimo: (value: number | "") => void;
  stockMaximo: number | "";
  setStockMaximo: (value: number | "") => void;
  esParaElaborar: boolean;
  setEsParaElaborar: (value: boolean) => void;
  unidadMedida: UnidadMedida | null;
  setUnidadMedida: (value: UnidadMedida | null) => void;
  categoria: Categoria | null;
  setCategoria: (value: Categoria | null) => void;
  unidadesMedida: UnidadMedida[];
  categorias: Categoria[];
  onSubmit: (insumo: InsumoDto) => void;
  onCancel: () => void;
  // Foto que el insumo ya tiene (al editar); null si no tiene o es un alta.
  imagenUrlInicial: string | null;
}

export const FormularioInsumo = ({
  modoEdicion,
  setModoEdicion,
  denominacion,
  setDenominacion,
  precioCompra,
  setPrecioCompra,
  precioVenta,
  setPrecioVenta,
  margen,
  setMargen,
  stockActual,
  setStockActual,
  stockMinimo,
  setStockMinimo,
  stockMaximo,
  setStockMaximo,
  esParaElaborar,
  setEsParaElaborar,
  unidadMedida,
  setUnidadMedida,
  categoria,
  setCategoria,
  unidadesMedida,
  categorias,
  onSubmit,
  onCancel,
  imagenUrlInicial,
}: Props) => {
  // Se decide al abrir el formulario: un insumo con margen cargado se edita por margen;
  // uno nuevo arranca por margen; uno con solo precio (margen vacío o 0) por precio.
  const [modoPrecio, setModoPrecio] = useState<"margen" | "precio">(() =>
    margen === "" ? (precioVenta === "" ? "margen" : "precio") : margen > 0 ? "margen" : "precio"
  );

  const precioVentaCalculado =
    precioCompra === "" || margen === ""
      ? null
      : Math.round(precioCompra * (1 + margen / 100) * 100) / 100;
  const margenCalculado =
    precioCompra === "" || precioVenta === "" || precioCompra === 0
      ? null
      : Math.round(((precioVenta - precioCompra) / precioCompra) * 10000) / 100;

  // Foto (mismo flujo que Productos): se elige acá y se sube recién al guardar.
  const [imagenUrl, setImagenUrl] = useState<string | null>(imagenUrlInicial);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const fotoMostrada = vistaPrevia ?? urlDeImagen(imagenUrl);

  const limpiarFotoElegida = () => {
    if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    setVistaPrevia(null);
    setArchivoFoto(null);
  };

  const handleElegirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
      alert("La foto debe ser una imagen JPG, PNG o WEBP.");
      return;
    }
    if (archivo.size > TAMANIO_MAXIMO_IMAGEN_MB * 1024 * 1024) {
      alert(`La foto supera el máximo de ${TAMANIO_MAXIMO_IMAGEN_MB} MB.`);
      return;
    }
    limpiarFotoElegida();
    setArchivoFoto(archivo);
    setVistaPrevia(URL.createObjectURL(archivo));
  };

  const handleQuitarFoto = () => {
    limpiarFotoElegida();
    setImagenUrl(null);
  };

  // Para elaborar -> categorías de insumos (Lácteos...). Se vende directo -> categorías de
  // productos (Bebidas...), que es donde aparece en el menú del cliente.
  const tipoCategoria = esParaElaborar ? "INSUMO" : "PRODUCTO";

  const handleCambiarParaElaborar = (valor: boolean) => {
    setEsParaElaborar(valor);
    const tipoNuevo = valor ? "INSUMO" : "PRODUCTO";
    if (categoria && categoria.tipo !== tipoNuevo) {
      setCategoria(null);
      setCategoriaActual(null);
      setSubcategorias([]);
      setHistorialCategorias([]);
    }
  };

  const [modalUnidadAbierto, setModalUnidadAbierto] = useState(false);
  const [denominacionOriginal, setDenominacionOriginal] = useState<
    string | null
  >(null);

  const [unidadesMedidasTemp, setUnidadesMedidasTemp] = useState<
    UnidadMedida[]
  >([]);
  const listaUnidades = [...unidadesMedida, ...unidadesMedidasTemp];

  const { cargarSubcategorias } = useCategoria();
  const [categoriaActual, setCategoriaActual] = useState<Categoria | null>(
    null
  );
  const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);
  const [historialCategorias, setHistorialCategorias] = useState<Categoria[]>(
    []
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const precioVentaFinal =
      modoPrecio === "margen" ? precioVentaCalculado : precioVenta === "" ? null : precioVenta;

    if (
      precioCompra === "" ||
      precioVentaFinal === null ||
      (modoPrecio === "margen" && margen === "") ||
      stockActual === "" ||
      stockMinimo === "" ||
      stockMaximo === "" ||
      !unidadMedida ||
      !categoria
    ) {
      alert("Todos los campos deben estar completos.");
      return;
    }
    if (precioVentaFinal <= 0) {
      alert("El precio de venta debe ser mayor a 0.");
      return;
    }

    const nuevoInsumo: InsumoDto = {
      denominacion,
      precioVenta: precioVentaFinal,
      precioCompra: Number(precioCompra),
      // Con margen el backend calcula el precio; sin margen usa el precio ingresado.
      margen: modoPrecio === "margen" ? Number(margen) : null,
      stockActual: Number(stockActual),
      stockMinimo: Number(stockMinimo),
      stockMaximo: Number(stockMaximo),
      esParaElaborar,
      unidadMedida,
      categoria,
      imagenUrl,
      archivoFoto,
    };

    onSubmit(nuevoInsumo);
  };
  const seleccionarCategoria = async (categoria: Categoria) => {
    setCategoria(categoria);
    setCategoriaActual(categoria);
    setHistorialCategorias((prev) => [...prev, categoria]);

    const hijas = await cargarSubcategorias(categoria.id!);
    setSubcategorias(hijas);
  };

  const handleGuardarUnidad = (nuevaUnidad: UnidadMedida) => {
    setUnidadMedida(nuevaUnidad);

    setUnidadesMedidasTemp((prev) => {
      if (modoEdicion && denominacionOriginal) {
        return prev.map((r) =>
          r.denominacion.trim().toLowerCase() ===
          denominacionOriginal.trim().toLowerCase()
            ? nuevaUnidad
            : r
        );
      } else {
        const existe = prev.some(
          (r) =>
            r.denominacion.trim().toLowerCase() ===
            nuevaUnidad.denominacion.trim().toLowerCase()
        );
        if (existe) {
          return prev;
        }
        return [...prev, nuevaUnidad];
      }
    });

    setModoEdicion(true);
    setModalUnidadAbierto(false);
  };

  const abrirModalUnidad = (unidad?: UnidadMedida) => {
    if (unidad) {
      setUnidadMedida(unidad);
      setDenominacionOriginal(unidad.denominacion);
      setModoEdicion(true);
    } else {
      setUnidadMedida(null);
      setDenominacionOriginal(null);
      setModoEdicion(false);
    }
    setModalUnidadAbierto(true);
  };

  const volverCategoriaAnterior = async () => {
    const nuevoHistorial = [...historialCategorias];
    nuevoHistorial.pop(); // Sacamos la actual
    const anterior = nuevoHistorial[nuevoHistorial.length - 1] || null;

    setHistorialCategorias(nuevoHistorial);
    setCategoria(anterior);
    setCategoriaActual(anterior);

    if (anterior) {
      const hijas = await cargarSubcategorias(anterior.id!);
      setSubcategorias(hijas);
    } else {
      setSubcategorias([]);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto px-4 py-6 bg-white rounded-2xl shadow-md space-y-6 overflow-y-auto"
      >
        {/* Grilla para inputs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Denominación
            </label>
            <input
              type="text"
              required
              value={denominacion}
              onChange={(e) => setDenominacion(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Precio Compra
            </label>
            <InputNumerico
              required
              value={precioCompra}
              onChange={setPrecioCompra}
              className={CLASE_INPUT}
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
            <span className="text-sm font-medium text-gray-700">
              Precio de venta: definilo por una de estas dos opciones
            </span>
            <div className="flex gap-6 text-sm text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="modoPrecio"
                  checked={modoPrecio === "margen"}
                  onChange={() => setModoPrecio("margen")}
                  className="accent-green-500"
                />
                Por margen de ganancia (%)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="modoPrecio"
                  checked={modoPrecio === "precio"}
                  onChange={() => setModoPrecio("precio")}
                  className="accent-green-500"
                />
                Por precio de venta
              </label>
            </div>

            {modoPrecio === "margen" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Margen (%)</label>
                  <InputNumerico
                    required
                    value={margen}
                    onChange={setMargen}
                    className={CLASE_INPUT}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Precio de venta resultante</span>
                  <span className="px-3 py-2 text-gray-900 font-semibold">
                    {precioVentaCalculado === null ? "—" : `$${precioVentaCalculado}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Precio Venta</label>
                  <InputNumerico
                    required
                    value={precioVenta}
                    onChange={setPrecioVenta}
                    className={CLASE_INPUT}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">Margen resultante</span>
                  <span className="px-3 py-2 text-gray-900 font-semibold">
                    {margenCalculado === null ? "—" : `${margenCalculado}%`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {[
            {
              label: "Stock Actual",
              value: stockActual,
              setter: setStockActual,
            },
            {
              label: "Stock Mínimo",
              value: stockMinimo,
              setter: setStockMinimo,
            },
            {
              label: "Stock Máximo",
              value: stockMaximo,
              setter: setStockMaximo,
            },
          ].map(({ label, value, setter }) => (
            <div className="flex flex-col gap-1" key={label}>
              <label className="text-sm font-medium text-gray-700">
                {label}
              </label>
              <InputNumerico
                required
                value={value}
                onChange={setter}
                className={CLASE_INPUT}
              />
            </div>
          ))}
        </div>

        {/* Checkbox separado */}
        <div className="flex items-center gap-2">
          <input
            id="elaborar"
            type="checkbox"
            checked={esParaElaborar}
            onChange={(e) => handleCambiarParaElaborar(e.target.checked)}
            className="accent-green-500 w-4 h-4"
          />
          <label htmlFor="elaborar" className="text-sm text-gray-700">
            ¿Es para elaborar?
          </label>
          <span className="text-xs text-gray-500">
            {esParaElaborar
              ? "Se usa en recetas. No aparece en el menú."
              : "Se vende directo: aparece en el menú del cliente, en su categoría."}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Foto</label>
          {fotoMostrada && (
            <img
              src={fotoMostrada}
              alt="Vista previa de la foto"
              className="h-32 w-full max-w-xs object-cover rounded border"
            />
          )}
          <div className="flex gap-2">
            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded">
              {fotoMostrada ? "Cambiar foto" : "Elegir foto"}
              <input
                type="file"
                accept={TIPOS_IMAGEN_PERMITIDOS.join(",")}
                className="hidden"
                onChange={handleElegirFoto}
              />
            </label>
            {fotoMostrada && (
              <button
                type="button"
                onClick={handleQuitarFoto}
                className="cursor-pointer bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
              >
                Quitar foto
              </button>
            )}
          </div>
          <span className="text-xs text-gray-500">
            JPG, PNG o WEBP, máximo {TAMANIO_MAXIMO_IMAGEN_MB} MB. Es opcional; se muestra en el menú si el insumo se vende directo.
          </span>
        </div>

        {/* Grilla para selects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Unidad de Medida
            </label>
            <select
              value={unidadMedida?.denominacion || ""}
              onChange={(e) => {
                const selected =
                  listaUnidades.find(
                    (u) => u.denominacion === e.target.value
                  ) || null;

                // Convierte el stock ya cargado a la nueva unidad (ej. 1.85 Kilos -> 1850
                // Gramos) para que siga representando la misma cantidad real. Si no se
                // reconoce alguna de las dos unidades, no se toca nada: mejor dejar el
                // número como está que convertir mal.
                const factorViejo = factorDe(unidadMedida);
                const factorNuevo = factorDe(selected);
                if (factorViejo !== null && factorNuevo !== null && factorViejo !== factorNuevo) {
                  const convertir = (valor: number | "") =>
                    valor === "" ? "" : convertirCantidad(valor, factorViejo, factorNuevo);
                  setStockActual(convertir(stockActual));
                  setStockMinimo(convertir(stockMinimo));
                  setStockMaximo(convertir(stockMaximo));
                }

                setUnidadMedida(selected);
              }}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="" disabled>
                Seleccione una unidad
              </option>
              {listaUnidades.map((unidad) => (
                <option key={unidad.id} value={unidad.denominacion}>
                  {unidad.denominacion}
                </option>
              ))}
            </select>

            {!modoEdicion && (
              <button
                type="button"
                onClick={() => abrirModalUnidad(unidadMedida || undefined)}
                className="cursor-pointer mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                {unidadMedida ? "Editar" : "+ Añadir"}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              {categoriaActual ? "Subcategorías de:" : "Categoría"}
            </label>

            {categoriaActual && (
              <p className="font-semibold text-green-700">
                {categoriaActual.denominacion}
              </p>
            )}

            {categoriaActual && subcategorias.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No hay subcategorías disponibles.
              </p>
            ) : (
              <select
                value={categoria?.id || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const seleccionada = (
                    categoriaActual
                      ? subcategorias
                      : categorias.filter((c) => !c.categoriaPadre && c.tipo === tipoCategoria)
                  ).find((c) => c.id === id);
                  if (seleccionada) seleccionarCategoria(seleccionada);
                }}
                required
                className="border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="" disabled>
                  Seleccione una Categoría
                </option>
                {(categoriaActual
                  ? subcategorias
                  : categorias.filter((c) => !c.categoriaPadre && c.tipo === tipoCategoria)
                ).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.denominacion}
                  </option>
                ))}
              </select>
            )}

            {(categoriaActual || historialCategorias.length > 0) && (
              <button
                type="button"
                onClick={volverCategoriaAnterior}
                className="cursor-pointer mt-2 px-3 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400"
              >
                Volver
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="cursor-pointer bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Guardar
          </button>
        </div>
      </form>
      {modalUnidadAbierto && (
        <Modal
          isOpen={modalUnidadAbierto}
          onClose={() => setModalUnidadAbierto(false)}
          titulo={modoEdicion ? "Editar Unidad Medida" : "Nueva Unidad Medida"}
        >
          <FormularioUnidadMedida
            onClose={() => setModalUnidadAbierto(false)}
            onGuardar={handleGuardarUnidad}
            unidadEnEdicion={unidadMedida}
            modoEdicion={modoEdicion}
          />
        </Modal>
      )}
    </div>
  );
};
