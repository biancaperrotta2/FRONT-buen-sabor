import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  obtenerOrdenCriptoSimulada,
  simularPagoCripto,
  simularVencimientoCripto,
  type MonedaCripto,
  type OrdenCriptoSimulada,
} from "../services/pedidoService";

const MONEDAS: { valor: MonedaCripto; nombre: string }[] = [
  { valor: "USDT", nombre: "Tether (USDT)" },
  { valor: "USDC", nombre: "USD Coin (USDC)" },
  { valor: "BTC", nombre: "Bitcoin (BTC)" },
  { valor: "ETH", nombre: "Ethereum (ETH)" },
];

const ESTADO_TERMINADO: Record<string, string> = {
  paid: "Esta orden ya fue pagada.",
  expired: "Esta orden de pago venció.",
  canceled: "Esta orden de pago fue cancelada.",
};

// Página de pago de la pasarela cripto simulada (cripto.proveedor=simulado en el backend). Hace
// las veces de la página de una pasarela real: el cliente elige la moneda y simula el resultado.
// No mueve dinero: lo dice bien visible para que nadie lo confunda con un pago real.
export const PagoCriptoSimulado = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState<OrdenCriptoSimulada | null>(null);
  const [moneda, setMoneda] = useState<MonedaCripto>("USDT");
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    obtenerOrdenCriptoSimulada(Number(id))
      .then(setOrden)
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar la orden de pago."));
  }, [id]);

  // Al terminar se vuelve a la pantalla de resultado (la misma que Mercado Pago), que verifica el
  // estado real del pedido en el backend.
  const simular = async (accion: () => Promise<OrdenCriptoSimulada>, destino: "successUrl" | "cancelUrl") => {
    setProcesando(true);
    setError(null);
    try {
      const actualizada = await accion();
      window.location.href = actualizada[destino];
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos completar la simulación.");
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 text-sm font-semibold px-5 py-3 text-center" role="note">
          Modo simulación — no se mueve dinero
        </div>

        <div className="p-6">
          <h1 className="text-xl font-bold mb-1">Pago con criptomonedas</h1>
          {orden && <p className="text-sm text-gray-500 mb-5">El Buen Sabor · Pedido #{orden.idPedido}</p>}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 mb-4">{error}</p>}
          {!orden && !error && <p className="text-sm text-gray-500">Cargando...</p>}

          {orden && orden.estado !== "new" && (
            <div className="text-center">
              <p className="text-gray-700 mb-4">{ESTADO_TERMINADO[orden.estado] ?? "Esta orden ya no está pendiente."}</p>
              <button
                onClick={() => navigate("/mis-pedidos")}
                className="bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold px-5 py-2 rounded-md"
              >
                Ver mis órdenes
              </button>
            </div>
          )}

          {orden && orden.estado === "new" && (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5 text-center">
                <p className="text-sm text-gray-500">Total a pagar</p>
                <p className="text-3xl font-bold">
                  {orden.montoUsd.toLocaleString("es-AR", { minimumFractionDigits: 2 })} USD
                </p>
              </div>

              <fieldset className="mb-5">
                <legend className="text-sm font-semibold mb-2">Elegí la moneda</legend>
                <div className="grid grid-cols-2 gap-2">
                  {MONEDAS.map((m) => (
                    <label
                      key={m.valor}
                      className={`flex items-center gap-2 border rounded-md px-3 py-2 text-sm cursor-pointer ${
                        moneda === m.valor ? "border-amber-700 bg-amber-50" : "border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="moneda"
                        value={m.valor}
                        checked={moneda === m.valor}
                        onChange={() => setMoneda(m.valor)}
                      />
                      {m.nombre}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <button
                  onClick={() => simular(() => simularPagoCripto(orden.id, moneda), "successUrl")}
                  disabled={procesando}
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
                >
                  {procesando ? "Procesando..." : `Simular pago aprobado (${moneda})`}
                </button>
                <button
                  onClick={() => simular(() => simularVencimientoCripto(orden.id), "cancelUrl")}
                  disabled={procesando}
                  className="w-full border border-red-600 text-red-600 hover:bg-red-50 font-semibold py-2 rounded-md disabled:opacity-60"
                >
                  Simular pago vencido
                </button>
                <button
                  onClick={() => {
                    window.location.href = orden.cancelUrl;
                  }}
                  disabled={procesando}
                  className="w-full text-gray-600 hover:text-gray-900 text-sm py-2"
                >
                  Volver sin pagar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PagoCriptoSimulado;
