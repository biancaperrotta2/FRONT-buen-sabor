import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import {
  confirmarCobroEfectivo,
  marcarEntregado,
  misEntregas,
  pedidosDisponiblesEnvio,
  tomarPedido,
  type PedidoEntrega,
} from "../services/pedidoService";

const INTERVALO_ACTUALIZACION_MS = 15000;

const formatearHora = (hora: string) => hora.slice(0, 5);

export const Repartidor = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [disponibles, setDisponibles] = useState<PedidoEntrega[]>([]);
  const [entregas, setEntregas] = useState<PedidoEntrega[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [listaDisponibles, listaEntregas] = await Promise.all([
        pedidosDisponiblesEnvio(),
        misEntregas(),
      ]);
      setDisponibles(listaDisponibles);
      setEntregas(listaEntregas);
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

  const handleTomar = async (id: number) => {
    setProcesando(id);
    try {
      await tomarPedido(id);
      await cargar();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "No pudimos asignarte este pedido. Puede que otro repartidor ya lo haya tomado."
      );
      await cargar();
    } finally {
      setProcesando(null);
    }
  };

  const handleEntregar = async (id: number) => {
    setProcesando(id);
    try {
      await marcarEntregado(id);
      await cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos marcar el pedido como entregado.");
    } finally {
      setProcesando(null);
    }
  };

  const handleConfirmarCobro = async (id: number) => {
    setProcesando(id);
    try {
      await confirmarCobroEfectivo(id);
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
          <h1 className="text-lg font-bold">EL BUEN SABOR — Repartidor</h1>
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

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </p>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-3">Mis entregas en curso</h2>
          {entregas.length === 0 ? (
            <p className="text-sm text-gray-500">No tenés entregas en curso.</p>
          ) : (
            <div className="space-y-3">
              {entregas.map((pedido) => (
                <div
                  key={pedido.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Pedido #{pedido.id}</p>
                    <span className="font-bold">${pedido.total.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600">{pedido.domicilioSnapshot}</p>
                  {pedido.aclaracionDomicilio && (
                    <p className="text-sm text-gray-500">{pedido.aclaracionDomicilio}</p>
                  )}
                  <p className="text-sm text-gray-500 mb-3">
                    {pedido.formaPago === "MERCADO_PAGO"
                      ? "Ya pagado con Mercado Pago"
                      : pedido.estadoPago === "PAGADO"
                        ? "Cobrado ✓"
                        : "Falta cobrar en efectivo"}{" "}
                    · Estimado {formatearHora(pedido.horaEstimadaFinalizacion)}
                  </p>

                  {pedido.formaPago === "EFECTIVO" && pedido.estadoPago !== "PAGADO" ? (
                    <button
                      onClick={() => handleConfirmarCobro(pedido.id)}
                      disabled={procesando === pedido.id}
                      className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
                    >
                      {procesando === pedido.id ? "Procesando..." : "CONFIRMAR COBRO"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEntregar(pedido.id)}
                      disabled={procesando === pedido.id}
                      className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
                    >
                      {procesando === pedido.id ? "Procesando..." : "MARCAR ENTREGADO"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Pedidos disponibles</h2>
          {cargando ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : disponibles.length === 0 ? (
            <p className="text-sm text-gray-500">No hay pedidos esperando reparto por ahora.</p>
          ) : (
            <div className="space-y-3">
              {disponibles.map((pedido) => (
                <div
                  key={pedido.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Pedido #{pedido.id}</p>
                    <span className="font-bold">${pedido.total.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600">{pedido.domicilioSnapshot}</p>
                  {pedido.aclaracionDomicilio && (
                    <p className="text-sm text-gray-500">{pedido.aclaracionDomicilio}</p>
                  )}
                  <p className="text-sm text-gray-500 mb-3">
                    {pedido.formaPago === "EFECTIVO" ? "Cobrar en efectivo" : "Ya pagado"} · Estimado{" "}
                    {formatearHora(pedido.horaEstimadaFinalizacion)}
                  </p>
                  <button
                    onClick={() => handleTomar(pedido.id)}
                    disabled={procesando === pedido.id}
                    className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
                  >
                    {procesando === pedido.id ? "Procesando..." : "TOMAR PEDIDO"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Repartidor;
