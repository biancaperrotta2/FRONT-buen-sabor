import { FaFacebookF, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail } from "react-icons/hi";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";

const Login: FC = () => {
  const navigate = useNavigate();

  const manejarRedireccionCorreo = () => {
    navigate("/loginemail");
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado izquierdo */}
      <div className="w-1/2 hidden lg:flex items-center justify-center bg-black relative">
        <img
          src={"assets/img/burgerRegistro.jpg"}
          alt="Hamburguesa"
          className="w-full h-full object-cover"
        />
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/60 z-10" />

        <div className="absolute text-white text-center px-6 z-20">
          <h1 className="text-4xl font-bold drop-shadow-md">EL BUEN SABOR</h1>
          <p className="text-xl font-medium mt-2 drop-shadow-md">
            CASERO & DELICIOSO
          </p>
        </div>
      </div>

      {/* Lado derecho */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12">
        <div className="max-w-md w-full space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              Te damos la <br /> Bienvenida a <br /> El Buen Sabor
            </h1>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Iniciá sesión</h2>
            <p className="text-sm text-gray-600">y disfrutá la experiencia</p>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-[#1877F2] text-white py-2 rounded flex items-center justify-center gap-2 text-sm font-medium hover:bg-[#166FE5] transition">
              <FaFacebookF className="text-base" />
              Continuar con Facebook
            </button>

            <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-100 transition">
              <FcGoogle className="text-base" />
              Continuar con Google
            </button>

            <button className="w-full bg-black text-white py-2 rounded flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-800 transition">
              <FaApple className="text-base" />
              Continuar con Apple
            </button>

            <button
              onClick={manejarRedireccionCorreo}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-100 transition"
            >
              <HiOutlineMail className="text-base" />
              Continuar con correo electrónico
            </button>
          </div>

          <div className="text-sm text-blue-600 text-center pt-4">
            <a href="#" className="inline-flex items-center gap-1 hover:underline">
              Continuar como invitado
              <span className="text-base">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

