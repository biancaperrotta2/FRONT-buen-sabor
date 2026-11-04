import { useEffect, useState } from "react";
import {
  agregarDomicilio,
  listarCiudades,
  misDomicilios,
  type Ciudad,
  type Domicilio,
} from "../services/pedidoService";

interface Props {
  seleccionado: Domicilio | null;
  onSeleccionar: (domicilio: Domicilio) => void;
}

export const SelectorDomicilio = ({ seleccionado, onSeleccionar }: Props) => {
  const [domicilios, setDomicilios] = useState<Domicilio[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [idCiudad, setIdCiudad] = useState<number | "">("");
  const [alias, setAlias] = useState("");

  useEffect(() => {
    Promise.all([misDomicilios(), listarCiudades()])
      .then(([listaDomicilios, listaCiudades]) => {
        setDomicilios(listaDomicilios);
        setCiudades(listaCiudades);
        if (listaDomicilios.length === 0) {
          setMostrarFormulario(true);
        } else if (!seleccionado) {
          onSeleccionar(listaDomicilios[0]);
        }
      })
      .catch(() => setError("No pudimos cargar tus direcciones guardadas."))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calle || !numero || !idCiudad) return;
    setError(null);
    setGuardando(true);
    try {
      const nuevo = await agregarDomicilio({
        calle,
        numero,
        idCiudad: Number(idCiudad),
        alias: alias || undefined,
      });
      setDomicilios((prev) => [...prev, nuevo]);
      onSeleccionar(nuevo);
      setMostrarFormulario(false);
      setCalle("");
      setNumero("");
      setIdCiudad("");
      setAlias("");
    } catch {
      setError("No pudimos guardar la dirección. Revisá los datos.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <p className="text-sm text-gray-500">Cargando direcciones...</p>;
  }

  return (
    <div className="text-sm">
      {domicilios.length > 0 && !mostrarFormulario && (
        <div className="space-y-2">
          <select
            value={seleccionado?.id ?? ""}
            onChange={(e) => {
              const elegido = domicilios.find((d) => d.id === Number(e.target.value));
              if (elegido) onSeleccionar(elegido);
            }}
            className="w-full border px-2 py-1 rounded-md"
          >
            {domicilios.map((d) => (
              <option key={d.id} value={d.id}>
                {(d.alias ? `${d.alias} — ` : "") + `${d.calle} ${d.numero}, ${d.ciudad}`}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="text-blue-600 hover:underline text-xs"
          >
            + Agregar otra dirección
          </button>
        </div>
      )}

      {mostrarFormulario && (
        <form onSubmit={handleAgregar} className="space-y-2 border rounded-md p-3 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Calle"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              required
              className="flex-1 border px-2 py-1 rounded-md text-sm"
            />
            <input
              type="text"
              placeholder="Número"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
              className="w-24 border px-2 py-1 rounded-md text-sm"
            />
          </div>
          <select
            value={idCiudad}
            onChange={(e) => setIdCiudad(e.target.value ? Number(e.target.value) : "")}
            required
            className="w-full border px-2 py-1 rounded-md text-sm"
          >
            <option value="">Ciudad...</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Alias (opcional, ej: Casa)"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="w-full border px-2 py-1 rounded-md text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="bg-amber-700 text-white text-xs px-3 py-1 rounded-md disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar dirección"}
            </button>
            {domicilios.length > 0 && (
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="text-xs px-3 py-1"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default SelectorDomicilio;
