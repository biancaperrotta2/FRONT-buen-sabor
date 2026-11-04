import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { verificarPagoMercadoPago } from "../services/pedidoService";

type Resultado = "verificando" | "aprobado" | "pendiente" | "rechazado" | "sinDatos";

const CONTENIDO: Record<Exclude<Resultado, "verificando">, { emoji: string; titulo: string; detalle: string }> = {
  aprobado: {
    emoji: "✅",
    titulo: "¡Pago aprobado!",
    detalle: "Ya recibimos tu pago. En breve empezamos a preparar tu pedido.",
  },
  pendiente: {
    emoji: "⏳",
    titulo: "Pago pendiente",
    detalle: "Tu pago está siendo procesado. Podés seguir su estado en \"Mis pedidos\".",
  },
  rechazado: {
    emoji: "❌",
    titulo: "No pudimos procesar el pago",
    detalle: "Mercado Pago rechazó el pago y el pedido se canceló. Podés hacer un pedido nuevo.",
  },
  sinDatos: {
    emoji: "ℹ️",
    titulo: "Volviste de Mercado Pago",
    detalle: "Podés ver el estado de tu pedido en \"Mis pedidos\".",
  },
};

// Mercado Pago vuelve acá agregando ?external_reference=<id del pedido>. En vez de confiar en la
// ruta (/pago/exito, /pendiente, /error) o en los parámetros, le pregunta al backend cómo salió el
// pago de verdad; eso además actualiza el pedido aunque el aviso automático (webhook) no llegue.
export const Aprobado = () => {
  const location = useLocation();
  const [resultado, setResultado] = useState<Resultado>("verificando");

  useEffect(() => {
    const idPedido = Number(new URLSearchParams(location.search).get("external_reference"));
    if (!idPedido) {
      setResultado("sinDatos");
      return;
    }
    verificarPagoMercadoPago(idPedido)
      .then((r) => {
        if (!r.pagoEncontrado) setResultado("pendiente");
        else if (r.estadoPago === "PAGADO") setResultado("aprobado");
        else if (r.estadoPago === "RECHAZADO") setResultado("rechazado");
        else setResultado("pendiente");
      })
      .catch(() => setResultado("sinDatos"));
  }, [location.search]);

  if (resultado === "verificando") {
    return (
      <div className="h-screen w-screen flex items-center justify-center px-6">
        <p className="text-gray-600" role="status">Verificando tu pago con Mercado Pago...</p>
      </div>
    );
  }

  const { emoji, titulo, detalle } = CONTENIDO[resultado];
  return (
    <div className="h-screen w-screen flex items-center justify-center flex-col gap-4 text-center px-6">
      <h1 className="text-2xl font-bold">
        {emoji} {titulo}
      </h1>
      <p className="text-gray-600 max-w-md">{detalle}</p>
      <div className="flex gap-3">
        <Link
          to="/mis-pedidos"
          className="rounded-sm px-6 py-2 border border-amber-700 text-amber-700 transition-all hover:scale-105"
        >
          Ver mis pedidos
        </Link>
        <Link
          to="/"
          className="rounded-sm px-6 py-2 text-white bg-amber-700 transition-all hover:scale-105"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default Aprobado;
