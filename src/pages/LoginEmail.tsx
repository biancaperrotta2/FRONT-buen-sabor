import type { FC } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 👈

const LoginEmail: FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // 👈

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nombreUsuario = email.split("@")[0];

    // 👇 Enviamos un objeto tipo Usuario
    login({ nombre: nombreUsuario });

    navigate("/"); // Redirige al home
  };

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
              placeholder="E-mail"
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

            <button
              type="submit"
              className="w-full bg-[#d6aa7b] text-whit
              e font-medium py-2 rounded-md hover:bg-[#c69a69] transition"
            >
              Continuar
            </button>
          </form>

          <div className="text-sm text-center pt-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/recuperarcontrasena");
              }}
              className="text-blue-600 hover:underline"
            >
              ¿Has olvidado la contraseña?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginEmail;
