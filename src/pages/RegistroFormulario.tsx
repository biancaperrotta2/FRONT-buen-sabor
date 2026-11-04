import type { FC } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetchJson, ApiError } from "../api/client";

const RegistroFormulario: FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [usuario, setUsuario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await apiFetchJson("/clientes/registro", {
        method: "POST",
        body: JSON.stringify({
          nombre,
          apellido,
          usuario,
          telefono,
          email,
          password,
          fechaNacimiento,
        }),
      });
      // Nos logueamos automáticamente con las credenciales recién creadas
      await login(usuario, password);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "No se pudo completar el registro.");
      } else {
        setError("No se pudo completar el registro. Intentá de nuevo.");
      }
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
            Creá tu cuenta
          </h2>
          <p className="text-sm text-gray-600">
            Registrate para hacer tus pedidos y disfrutar de beneficios
          </p>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="border-b border-gray-300 py-2 focus:outline-none focus:border-gray-500 text-sm"
              />
              <input
                type="text"
                placeholder="Apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                className="border-b border-gray-300 py-2 focus:outline-none focus:border-gray-500 text-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-gray-500 text-sm"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-gray-500 text-sm"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required
              className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-gray-500 text-sm"
            />
            <div>
              <label className="text-xs text-gray-500">Fecha de nacimiento</label>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                required
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-gray-500 text-sm"
              />
            </div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-gray-500 text-sm"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#d6aa7b] text-white font-medium py-2 rounded-md hover:bg-[#c69a69] transition disabled:opacity-60 mt-2"
            >
              {cargando ? "Creando cuenta..." : "Registrarme"}
            </button>
          </form>

          <div className="text-sm text-center pt-2">
            ¿Ya tenés cuenta?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/loginemail");
              }}
              className="text-blue-600 hover:underline"
            >
              Iniciá sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroFormulario;
