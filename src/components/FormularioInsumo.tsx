import type { FormEvent } from "react";
import { useState } from "react";
import { UnidadMedida } from "../classes/UnidadMedidaClass";
import type { Categoria } from "../classes/CategoriaClass";
import type { InsumoDto } from "../pages/Insumo";
import Modal from "./Modal";
import { FormularioUnidadMedida } from "./FormularioUnidadMedida";
import { useCategoria } from "../context/CategoriaContext";
import type { CategoriaDto } from "../pages/Categorias";

export interface InsumoRecord {
  denominacion: string;
  precioVenta: number;
  precioCompra: number;
  stockActual: number;
  stockMaximo: number;
  esParaElaborar: boolean;
  unidadMedida: UnidadMedida;
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
  stockActual: number | "";
  setStockActual: (value: number | "") => void;
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
  stockActual,
  setStockActual,
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
}: Props) => {
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

    if (
      precioCompra === "" ||
      precioVenta === "" ||
      stockActual === "" ||
      stockMaximo === "" ||
      !unidadMedida ||
      !categoria
    ) {
      alert("Todos los campos deben estar completos.");
      return;
    }
    if (
      precioCompra < 0 ||
      precioVenta < 0 ||
      stockActual < 0 ||
      stockMaximo < 0
    ) {
      alert("Los valores no pueden ser negativos");
      return;
    }

    const nuevoInsumo: InsumoDto = {
      denominacion,
      precioVenta: Number(precioVenta),
      precioCompra: Number(precioCompra),
      stockActual: Number(stockActual),
      stockMaximo: Number(stockMaximo),
      esParaElaborar,
      unidadMedida,
      categoria,
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

          {[
            {
              label: "Precio Compra",
              value: precioCompra,
              setter: setPrecioCompra,
            },
            {
              label: "Precio Venta",
              value: precioVenta,
              setter: setPrecioVenta,
            },
            {
              label: "Stock Actual",
              value: stockActual,
              setter: setStockActual,
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
              <input
                type="number"
                required
                min={0}
                value={value}
                onChange={(e) =>
                  setter(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="no-spinner border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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
            onChange={(e) => setEsParaElaborar(e.target.checked)}
            className="accent-green-500 w-4 h-4"
          />
          <label htmlFor="elaborar" className="text-sm text-gray-700">
            ¿Es para elaborar?
          </label>
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
                      : categorias.filter((c) => !c.categoriaPadre)
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
                  : categorias.filter((c) => !c.categoriaPadre)
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
