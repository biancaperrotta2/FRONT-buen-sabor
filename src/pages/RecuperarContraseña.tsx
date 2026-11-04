import type { FC } from "react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { solicitarRecuperacionContrasena } from "../services/authFirebaseService";

const RecuperarContrasena: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailInicial = (location.state as { email?: string } | null)?.email ?? "";

  const [email, setEmail] = useState(emailInicial);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await solicitarRecuperacionContrasena(email);
      setEnviado(true);
    } catch {
      setError("No pudimos enviar el mail. Revisá que el email esté bien escrito.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-1/2 hidden lg:flex relative">
        <img
          src="assets/img/burgerRegistro.jpg"
          alt="Hamburguesa"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute text-white text-center px-6 z-20 m-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-3xl font-bold tracking-wide">EL BUEN SABOR</h1>
          <p className="text-xl font-semibold mt-2 tracking-wider">
            CASERO & DELICIOSO
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 py-12">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 leading-snug">
            Recuperar contraseña
          </h2>

          {enviado ? (
            <p className="text-sm text-gray-700">
              Te enviamos un mail a <strong>{email}</strong>. Abrí el link para
              elegir tu contraseña nueva y después volvé a iniciar sesión con ella.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Ingresá tu email y te mandamos un link para elegir una contraseña nueva.
              </p>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-gray-500 text-sm"
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full bg-[#d6aa7b] text-white font-medium py-2 rounded-md hover:bg-[#c69a69] transition disabled:opacity-60"
                >
                  {cargando ? "Enviando..." : "Enviar mail de recuperación"}
                </button>
              </form>
            </>
          )}

          <div className="text-sm text-center pt-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/loginemail");
              }}
              className="text-blue-600 hover:underline"
            >
              Volver a iniciar sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecuperarContrasena;
