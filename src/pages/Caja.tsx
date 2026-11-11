import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { Modal } from "../components/Modal";
import {
  cambiarEstadoPedido,
  confirmarCobroEfectivo,
  verificarPagoMercadoPago,
  pedidosParaEntregarEnLocal,
  pedidosPendientes,
  rechazarPedido,
  reintegrosPendientes,
  marcarReintegrado,
  type PedidoCaja,
} from "../services/pedidoService";

const INTERVALO_ACTUALIZACION_MS = 15000;

const formatearHora = (hora: string) => hora.slice(0, 5);

// Mismo límite que valida el backend (RechazoPedidoRequest.motivo).
const MAX_MOTIVO = 255;

interface PropsRechazo {
  pedido: PedidoCaja;
  onCancelar: () => void;
  onRechazado: () => void;
}

// Diálogo del botón "Rechazar": el motivo es obligatorio porque es lo que ve el cliente.
const DialogoRechazo = ({ pedido, onCancelar, onRechazado }: PropsRechazo) => {
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El reintegro automático falló: se ofrece rechazar igual y devolver desde el panel de MP.
  const [fallaReintegro, setFallaReintegro] = useState(false);
  const seReintegra = pedido.formaPago === "MERCADO_PAGO" && pedido.estadoPago === "PAGADO";

  const confirmar = async (reintegroManual: boolean) => {
    if (!motivo.trim()) {
      setError("Escribí el motivo del rechazo.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await rechazarPedido(pedido.id, motivo.trim(), reintegroManual);
      onRechazado();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos rechazar el pedido.");
      if (seReintegra && !reintegroManual) setFallaReintegro(true);
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-rechazo"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 id="titulo-rechazo" className="text-lg font-bold mb-1">
          Rechazar pedido #{pedido.id}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          El pedido queda cancelado y el cliente ve el motivo en "Mis pedidos".
          {seReintegra && " Como ya está pagado, se le devuelve el pago por Mercado Pago."}
        </p>
        <label htmlFor="motivo-rechazo" className="text-sm font-medium block mb-1">
          Motivo
        </label>
        <textarea
          id="motivo-rechazo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={MAX_MOTIVO}
          rows={3}
          autoFocus
          placeholder="Ej: no nos queda rúcula para la pizza"
          className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none"
        />
        <p className="text-xs text-gray-500 text-right mb-2">
          {motivo.length}/{MAX_MOTIVO}
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {fallaReintegro && (
          <div className="mb-3 bg-amber-50 border border-amber-300 rounded-md p-3">
            <p className="text-sm text-amber-900 mb-2">
              Mercado Pago no pudo devolver el pago automáticamente. Podés rechazar el pedido igual y
              hacer la devolución desde el panel de Mercado Pago; queda anotado en "Pagos para devolver".
            </p>
            <button
              onClick={() => confirmar(true)}
              disabled={enviando}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
            >
              Rechazar igual y devolver desde Mercado Pago
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onCancelar}
            disabled={enviando}
            className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 rounded-md disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={() => confirmar(false)}
            disabled={enviando}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-md disabled:opacity-60"
          >
            {enviando ? "Rechazando..." : "Rechazar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Caja = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [pendientes, setPendientes] = useState<PedidoCaja[]>([]);
  const [paraEntregar, setParaEntregar] = useState<PedidoCaja[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);
  // Resultado de "Verificar pago" por pedido, para mostrarlo debajo de su tarjeta.
  const [avisoPago, setAvisoPago] = useState<Record<number, string>>({});
  const [aRechazar, setARechazar] = useState<PedidoCaja | null>(null);
  const [paraDevolver, setParaDevolver] = useState<PedidoCaja[]>([]);
  const [aMarcarDevuelto, setAMarcarDevuelto] = useState<PedidoCaja | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [listaPendientes, listaParaEntregar] = await Promise.all([
        pedidosPendientes(),
        pedidosParaEntregarEnLocal(),
      ]);
      // Aparte: si falla, no tapa las otras dos listas.
      reintegrosPendientes().then(setParaDevolver).catch(() => setParaDevolver([]));
      setPendientes(listaPendientes);
      setParaEntregar(listaParaEntregar);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos cargar los pedidos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, INTERVALO_ACTUALIZACION_MS);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const handleAceptar = async (id: number) => {
    setProcesando(id);
    try {
      await cambiarEstadoPedido(id, "EN_PROCESO");
      await cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos aceptar el pedido.");
    } finally {
      setProcesando(null);
    }
  };

  const handleEntregar = async (pedido: PedidoCaja) => {
    setProcesando(pedido.id);
    try {
      await cambiarEstadoPedido(pedido.id, "ENTREGADO");
      // Con el pago ya confirmado (efectivo cobrado o Mercado Pago aprobado), el backend
      // factura solo al quedar Entregado + Pagado.
      await cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos completar la entrega.");
    } finally {
      setProcesando(null);
    }
  };

  // Para un pedido de Mercado Pago que figura sin pagar: se le pregunta a MP en el momento
  // (por si el aviso automático no llegó).
  const handleVerificarPago = async (pedido: PedidoCaja) => {
    setProcesando(pedido.id);
    try {
      const r = await verificarPagoMercadoPago(pedido.id);
      setAvisoPago((prev) => ({
        ...prev,
        [pedido.id]: !r.pagoEncontrado
          ? "Mercado Pago todavía no registra ningún pago para este pedido."
          : r.estadoPago === "PAGADO"
            ? "Pago confirmado por Mercado Pago."
            : r.estadoPago === "REINTEGRADO"
              ? "El pago fue devuelto al cliente."
              : r.estadoPago === "RECHAZADO"
              ? "Mercado Pago rechazó el pago: el pedido se canceló."
              : "El pago sigue pendiente en Mercado Pago.",
      }));
      await cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos consultar el pago en Mercado Pago.");
    } finally {
      setProcesando(null);
    }
  };

  const handleMarcarDevuelto = async (pedido: PedidoCaja) => {
    setProcesando(pedido.id);
    try {
      await marcarReintegrado(pedido.id);
      setAMarcarDevuelto(null);
      await cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos marcar el pago como devuelto.");
    } finally {
      setProcesando(null);
    }
  };

  const handleConfirmarCobro = async (pedido: PedidoCaja) => {
    setProcesando(pedido.id);
    try {
      await confirmarCobroEfectivo(pedido.id);
      await cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos confirmar el cobro.");
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-amber-700 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">EL BUEN SABOR — Caja</h1>
          {usuario && <p className="text-sm text-amber-100">Hola, {usuario.nombre}</p>}
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/loginemail");
          }}
          className="text-sm border border-white rounded-md px-3 py-1 hover:bg-white hover:text-amber-700 transition"
        >
          Cerrar sesión
        </button>
      </header>

      <Modal
        isOpen={aMarcarDevuelto !== null}
        onClose={() => setAMarcarDevuelto(null)}
        titulo={aMarcarDevuelto ? `Pago del pedido #${aMarcarDevuelto.id}` : ""}
      >
        {aMarcarDevuelto && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              ¿Ya devolviste los ${aMarcarDevuelto.total.toLocaleString()} desde el panel de Mercado Pago?
              El cliente va a ver que se le devolvió el pago.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setAMarcarDevuelto(null)}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleMarcarDevuelto(aMarcarDevuelto)}
                disabled={procesando === aMarcarDevuelto.id}
                className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
              >
                Sí, ya lo devolví
              </button>
            </div>
          </div>
        )}
      </Modal>

      {aRechazar && (
        <DialogoRechazo
          pedido={aRechazar}
          onCancelar={() => setARechazar(null)}
          onRechazado={() => {
            setARechazar(null);
            cargar();
          }}
        />
      )}

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </p>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-3">Pedidos por aceptar</h2>
          {cargando ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : pendientes.length === 0 ? (
            <p className="text-sm text-gray-500">No hay pedidos nuevos por aceptar.</p>
          ) : (
            <div className="space-y-3">
              {pendientes.map((pedido) => (
                <div
                  key={pedido.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Pedido #{pedido.id}</p>
                    <span className="font-bold">${pedido.total.toLocaleString()}</span>
                  </div>
                  {pedido.cliente && (
                    <p className="text-sm text-gray-600">
                      {pedido.cliente.nombre} {pedido.cliente.apellido}
                    </p>
                  )}
                  {pedido.aclaraciones && (
                    <p className="text-sm text-gray-700 italic">Aclaraciones: {pedido.aclaraciones}</p>
                  )}
                  <p
                    className={`text-sm text-gray-500 ${
                      pedido.formaPago === "MERCADO_PAGO" && pedido.estadoPago !== "PAGADO"
                        ? "mb-1"
                        : "mb-3"
                    }`}
                  >
                    {pedido.tipoEnvio === "DELIVERY" ? "Delivery" : "Retiro en tienda"} ·{" "}
                    {pedido.formaPago === "EFECTIVO" ? "Efectivo" : "Mercado Pago"} · Estimado{" "}
                    {formatearHora(pedido.horaEstimadaFinalizacion)}
                  </p>
                  {pedido.formaPago === "MERCADO_PAGO" && pedido.estadoPago !== "PAGADO" && (
                    <div className="mb-3">
                      <p className="text-sm text-amber-700 mb-2">
                        Pago todavía no confirmado por Mercado Pago
                      </p>
                      <button
                        onClick={() => handleVerificarPago(pedido)}
                        disabled={procesando === pedido.id}
                        className="w-full border border-amber-700 text-amber-700 hover:bg-amber-50 font-semibold py-2 rounded-md disabled:opacity-60"
                      >
                        Verificar pago en Mercado Pago
                      </button>
                    </div>
                  )}
                  {avisoPago[pedido.id] && (
                    <p className="text-sm text-gray-700 mb-3" role="status">
                      {avisoPago[pedido.id]}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setARechazar(pedido)}
                      disabled={procesando === pedido.id}
                      className="flex-1 bg-white border border-red-600 text-red-600 hover:bg-red-50 font-semibold py-2 rounded-md disabled:opacity-60"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleAceptar(pedido.id)}
                      disabled={procesando === pedido.id}
                      className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
                    >
                      {procesando === pedido.id ? "Procesando..." : "Aceptar pedido"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {paraDevolver.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-1">Pagos para devolver</h2>
            <p className="text-sm text-gray-600 mb-3">
              Pedidos rechazados que ya estaban pagados con Mercado Pago. Devolvé el pago desde el panel
              de Mercado Pago y después marcalo acá.
            </p>
            <div className="space-y-3">
              {paraDevolver.map((pedido) => (
                <div key={pedido.id} className="bg-amber-50 rounded-lg border border-amber-300 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Pedido #{pedido.id}</p>
                    <span className="font-bold">${pedido.total.toLocaleString()}</span>
                  </div>
                  {pedido.cliente && (
                    <p className="text-sm text-gray-600 mb-3">
                      {pedido.cliente.nombre} {pedido.cliente.apellido}
                    </p>
                  )}
                  <button
                    onClick={() => setAMarcarDevuelto(pedido)}
                    disabled={procesando === pedido.id}
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
                  >
                    Marcar como devuelto
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-3">Listos para entregar y cobrar</h2>
          {cargando ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : paraEntregar.length === 0 ? (
            <p className="text-sm text-gray-500">No hay pedidos esperando en el mostrador.</p>
          ) : (
            <div className="space-y-3">
              {paraEntregar.map((pedido) => (
                <div
                  key={pedido.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Pedido #{pedido.id}</p>
                    <span className="font-bold">${pedido.total.toLocaleString()}</span>
                  </div>
                  {pedido.cliente && (
                    <p className="text-sm text-gray-600">
                      {pedido.cliente.nombre} {pedido.cliente.apellido}
                    </p>
                  )}
                  {pedido.aclaraciones && (
                    <p className="text-sm text-gray-700 italic">Aclaraciones: {pedido.aclaraciones}</p>
                  )}
                  <p className="text-sm text-gray-500 mb-3">
                    {pedido.formaPago === "MERCADO_PAGO"
                      ? "Ya pagado con Mercado Pago"
                      : pedido.estadoPago === "PAGADO"
                        ? "Cobrado ✓"
                        : "Falta cobrar en efectivo"}
                  </p>

                  {pedido.formaPago === "EFECTIVO" && pedido.estadoPago !== "PAGADO" ? (
                    <button
                      onClick={() => handleConfirmarCobro(pedido)}
                      disabled={procesando === pedido.id}
                      className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
                    >
                      {procesando === pedido.id ? "Procesando..." : "Confirmar cobro"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEntregar(pedido)}
                      disabled={procesando === pedido.id}
                      className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
                    >
                      {procesando === pedido.id ? "Procesando..." : "Entregar"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Caja;
