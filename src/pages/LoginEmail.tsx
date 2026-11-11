import type { FC } from "react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { panelDelRol, rutaInicioSegunRol } from "../utils/rutasPorRol";

const LoginEmail: FC = () => {
  const navigate = useNavigate();
  const { usuario, cargando: cargandoSesion, login, loginConFirebase } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // El local es de cara al cliente; un empleado que se loguea acá va directo a su propio
  // panel en vez de a la tienda.
  const redirigirSegunRol = (usuario: { rol: string }) => {
    navigate(rutaInicioSegunRol(usuario.rol));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const usuario = await login(email, password);
      redirigirSegunRol(usuario);
    } catch (err) {
      // 403 = credenciales correctas pero cuenta desactivada: no hay nada que reintentar.
      if (err instanceof ApiError && err.status === 403) {
        setError(err.message);
        setCargando(false);
        return;
      }
      // Si el login normal falla, puede ser un usuario que reseteó su
      // contraseña con Firebase (esa contraseña ya no está en nuestra base):
      // se reintenta por ese camino antes de mostrar el error final.
      try {
        const usuario = await loginConFirebase(email, password);
        redirigirSegunRol(usuario);
      } catch {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setError("Usuario o contraseña incorrectos.");
        } else {
          setError("No se pudo iniciar sesión. Intentá de nuevo.");
        }
      }
    } finally {
      setCargando(false);
    }
  };

  // Un empleado con la sesión ya abierta no necesita volver a loguearse.
  const panel = !cargandoSesion ? panelDelRol(usuario?.rol) : null;
  if (panel) return <Navigate to={panel} replace />;

  return (
    <div className="flex min-h-screen">
      {/* Imagen lado izquierdo */}
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

      {/* Formulario lado derecho */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 py-12">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 leading-snug">
            ¡Qué alegría verte <br /> de nuevo por aquí!
          </h2>
          <p className="text-sm text-gray-600">
            Ingresá tus datos y disfrutá de beneficios infinitos
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
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-gray-500 text-sm"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#d6aa7b] text-white font-medium py-2 rounded-md hover:bg-[#c69a69] transition disabled:opacity-60"
            >
              {cargando ? "Ingresando..." : "Continuar"}
            </button>
          </form>

          <div className="text-sm text-center pt-2 space-y-2">
            <p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/recuperarcontrasena", { state: { email } });
                }}
                className="text-blue-600 hover:underline"
              >
                ¿Has olvidado la contraseña?
              </a>
            </p>
            <p>
              ¿No tenés cuenta?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/registro");
                }}
                className="text-blue-600 hover:underline"
              >
                Registrate
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginEmail;
