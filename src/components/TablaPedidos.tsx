import { EncabezadoOrdenable } from "./EncabezadoOrdenable";
import { ETIQUETA_ESTADO } from "./DialogoOrden";
import { esPagoOnline } from "../utils/formaPago";
import type { PedidoFila } from "../services/ordenesService";
import type { Direccion } from "../services/paginacion";

interface Props {
  filas: PedidoFila[];
  modo: "caja" | "cocina";
  ordenarPor: string | null;
  direccion: Direccion;
  alClickearColumna: (campo: string) => void;
  onVer: (idPedido: number) => void;
}

const formatearFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

// Minutos que faltan para la hora estimada (los pedidos de cocina son del día).
const minutosRestantes = (hora: string) => {
  const ahora = new Date();
  const [h, m] = hora.split(":").map(Number);
  const estimada = new Date(ahora);
  estimada.setHours(h, m, 0, 0);
  return Math.round((estimada.getTime() - ahora.getTime()) / 60000);
};

const Pastilla = ({ texto, alerta = false }: { texto: string; alerta?: boolean }) => (
  <span
    className={`inline-block border rounded-full px-3 py-0.5 text-xs whitespace-nowrap ${
      alerta ? "border-red-500 text-red-700" : "border-gray-400 text-gray-600"
    }`}
  >
    {texto}
  </span>
);

// Tabla de Órdenes / Cocina (figuras 32 y 36): clic en la fila o en "Ver detalle" abre el diálogo.
const TablaPedidos = ({ filas, modo, ordenarPor, direccion, alClickearColumna, onVer }: Props) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left text-gray-700">
      <thead className="text-xs uppercase text-gray-500 bg-gray-100">
        <tr>
          <EncabezadoOrdenable campo="id" etiqueta="Orden" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
          <EncabezadoOrdenable campo="fechaPedido" etiqueta="Fecha" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
          <EncabezadoOrdenable campo="cliente.nombre" etiqueta="Cliente" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
          <EncabezadoOrdenable campo="horaEstimadaFinalizacion" etiqueta="Tiempo" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
          <EncabezadoOrdenable campo="tipoEnvio" etiqueta="Envío" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
          <EncabezadoOrdenable campo="estado" etiqueta="Estado" ordenarPor={ordenarPor} direccion={direccion} onClick={alClickearColumna} />
          <th className="px-6 py-3">
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {filas.map((p) => {
          const restantes = minutosRestantes(p.horaEstimadaFinalizacion);
          const atrasado = modo === "cocina" && restantes < 0;
          const pagoPendiente = modo === "caja" && esPagoOnline(p.formaPago) && p.estadoPago !== "PAGADO" && p.estado !== "CANCELADO";
          return (
            <tr
              key={p.id}
              onClick={() => onVer(p.id)}
              className={`border-t border-gray-200 cursor-pointer hover:bg-gray-50 ${atrasado ? "bg-red-50" : ""}`}
            >
              <td className="px-6 py-3 font-medium">#{p.id}</td>
              <td className="px-6 py-3">{formatearFecha(p.fechaPedido)}</td>
              <td className="px-6 py-3">{p.cliente ?? "—"}</td>
              <td className={`px-6 py-3 whitespace-nowrap ${atrasado ? "text-red-700 font-semibold" : ""}`}>
                {modo === "cocina"
                  ? atrasado
                    ? `Atrasado ${-restantes} m.`
                    : `${restantes} m.`
                  : `${p.horaEstimadaFinalizacion.slice(0, 5)} hs`}
              </td>
              <td className="px-6 py-3">
                <Pastilla texto={p.tipoEnvio === "DELIVERY" ? "Domicilio" : "Retiro"} />
              </td>
              <td className="px-6 py-3">
                <Pastilla texto={ETIQUETA_ESTADO[p.estado]} />
                {pagoPendiente && <span className="block text-xs text-amber-700 mt-1">Pago sin confirmar</span>}
              </td>
              <td className="px-6 py-3 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVer(p.id);
                  }}
                  className="text-xs font-semibold text-amber-800 border border-amber-700 rounded-md px-3 py-1 hover:bg-amber-50 whitespace-nowrap"
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default TablaPedidos;
