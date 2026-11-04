import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import {
  cambiarEstadoPedido,
  pedidosParaCocina,
  type ItemCocina,
  type PedidoCocina,
} from "../services/pedidoService";

const INTERVALO_ACTUALIZACION_MS = 15000;

const formatearHora = (hora: string) => hora.slice(0, 5);

// El backend guarda LocalTime sin fecha; comparar solo hora:minuto contra el reloj
// alcanza para esta pantalla (los pedidos de cocina son siempre del mismo día).
const estaAtrasado = (horaEstimada: string) => {
  const ahora = new Date();
  const [h, m] = horaEstimada.split(":").map(Number);
  const estimada = new Date(ahora);
  estimada.setHours(h, m, 0, 0);
  return ahora > estimada;
};

// Producto del pedido; en un combo se listan debajo los productos que incluye.
const LineaItem = ({ item }: { item: ItemCocina }) => {
  const [verPreparacion, setVerPreparacion] = useState(false);
  return (
    <li>
      <div className="flex items-start justify-between gap-2">
        <span>
          <span className="font-semibold">{item.cantidad} ×</span> {item.nombre}
        </span>
        {item.preparacion && (
          <button
            type="button"
            onClick={() => setVerPreparacion((v) => !v)}
            className="shrink-0 text-xs text-amber-700 border border-amber-700 rounded px-2 py-0.5 hover:bg-amber-50"
          >
            {verPreparacion ? "Ocultar preparación" : "Ver preparación"}
          </button>
        )}
      </div>
      {verPreparacion && item.preparacion && (
        <p className="text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded p-2 mt-1 whitespace-pre-line">
          {item.preparacion}
        </p>
      )}
      {item.incluye.length > 0 && (
        <ul className="ml-5 mt-1 space-y-1 border-l-2 border-amber-200 pl-3 text-gray-700">
          {item.incluye.map((sub, i) => (
            <LineaItem key={i} item={sub} />
          ))}
        </ul>
      )}
    </li>
  );
};

export const Cocina = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [pedidos, setPedidos] = useState<PedidoCocina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const lista = await pedidosParaCocina();
      setPedidos(lista);
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

  const handleCambiarEstado = async (id: number, nuevoEstado: "DEMORADO" | "PREPARADO") => {
    setProcesando(id);
    try {
      await cambiarEstadoPedido(id, nuevoEstado);
      await cargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No pudimos actualizar el pedido.");
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-amber-700 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">EL BUEN SABOR — Cocina</h1>
          {usuario && <p className="text-sm text-amber-100">Hola, {usuario.nombre}</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/semielaborados")}
            className="text-sm bg-white text-amber-700 font-semibold rounded-md px-3 py-1 hover:bg-amber-100 transition"
          >
            Semielaborados
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/loginemail");
            }}
            className="text-sm border border-white rounded-md px-3 py-1 hover:bg-white hover:text-amber-700 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3 mb-6">
            {error}
          </p>
        )}

        <h2 className="text-lg font-semibold mb-3">Pedidos en cocina</h2>

        {cargando ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : pedidos.length === 0 ? (
          <p className="text-sm text-gray-500">No hay pedidos en cocina por ahora.</p>
        ) : (
          <div className="space-y-3">
            {pedidos.map((pedido) => {
              const atrasado = estaAtrasado(pedido.horaEstimadaFinalizacion);
              return (
                <div
                  key={pedido.id}
                  className={`rounded-lg shadow-sm border p-4 ${
                    atrasado ? "bg-red-50 border-red-300" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Pedido #{pedido.id}</p>
                    {atrasado && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-600 text-white">
                        Atrasado
                      </span>
                    )}
                  </div>
                  {pedido.cliente && (
                    <p className="text-sm text-gray-600">
                      {pedido.cliente.nombre} {pedido.cliente.apellido}
                    </p>
                  )}
                  <p className={`text-sm mb-3 ${atrasado ? "text-red-700 font-semibold" : "text-gray-500"}`}>
                    {pedido.tipoEnvio === "DELIVERY" ? "Delivery" : "Retiro en tienda"} · Estimado{" "}
                    {formatearHora(pedido.horaEstimadaFinalizacion)}
                    {pedido.estadoPedido === "DEMORADO" && " · Ya demorado antes"}
                  </p>
                  <ul className="text-sm space-y-1 mb-3">
                    {pedido.items.map((item, i) => (
                      <LineaItem key={i} item={item} />
                    ))}
                  </ul>
                  {pedido.aclaraciones && (
                    <p className="text-sm bg-yellow-50 border border-yellow-300 rounded-md p-2 mb-3">
                      <span className="font-semibold">Aclaraciones:</span> {pedido.aclaraciones}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCambiarEstado(pedido.id, "DEMORADO")}
                      disabled={procesando === pedido.id}
                      className="flex-1 bg-white border border-amber-700 text-amber-700 hover:bg-amber-50 font-semibold py-2 rounded-md disabled:opacity-60"
                    >
                      Marcar demorado
                    </button>
                    <button
                      onClick={() => handleCambiarEstado(pedido.id, "PREPARADO")}
                      disabled={procesando === pedido.id}
                      className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
                    >
                      {procesando === pedido.id ? "Procesando..." : "Marcar listo"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cocina;
