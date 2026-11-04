import { HiOutlineMail } from "react-icons/hi";
import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Una sola promesa compartida a nivel de módulo: si el efecto de abajo corre dos veces
// (React StrictMode en desarrollo monta/desmonta/remonta cada componente una vez) la
// segunda llamada no debe creer que el script ya cargó solo porque la etiqueta <script>
// ya existe en el DOM — puede estar todavía en camino. Todos esperan a la misma promesa,
// que recién se resuelve cuando el script realmente terminó de cargar.
let promesaCargaGoogle: Promise<void> | null = null;
const cargarScriptGoogle = (): Promise<void> => {
  if (promesaCargaGoogle) return promesaCargaGoogle;
  promesaCargaGoogle = new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) {
      resolve();
      return;
    }
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existente) {
      existente.addEventListener("load", () => resolve());
      existente.addEventListener("error", () => reject(new Error("No se pudo cargar Google")));
      return;
    }
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google"));
    document.head.appendChild(script);
  });
  return promesaCargaGoogle;
};

const Login: FC = () => {
  const navigate = useNavigate();
  const { loginConGoogle } = useAuth();
  const botonGoogleRef = useRef<HTMLDivElement>(null);
  const [errorGoogle, setErrorGoogle] = useState<string | null>(null);

  const manejarRedireccionCorreo = () => {
    navigate("/loginemail");
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setErrorGoogle("El login con Google no está configurado.");
      return;
    }
    let cancelado = false;

    cargarScriptGoogle()
      .then(() => {
        if (cancelado || !botonGoogleRef.current) return;
        const google = (window as any).google;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (respuesta: { credential: string }) => {
            try {
              await loginConGoogle(respuesta.credential);
              navigate("/");
            } catch (e) {
              setErrorGoogle(e instanceof ApiError ? e.message : "No se pudo iniciar sesión con Google.");
            }
          },
        });
        google.accounts.id.renderButton(botonGoogleRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        });
      })
      .catch(() => {
        if (!cancelado) setErrorGoogle("No se pudo cargar el botón de Google.");
      });

    return () => {
      cancelado = true;
    };
  }, [loginConGoogle, navigate]);

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
            {/* Google exige renderizar su propio botón oficial; por eso no comparte el
                estilo del resto (el div queda vacío hasta que el script de Google carga). */}
            <div ref={botonGoogleRef} className="flex justify-center" />
            {errorGoogle && <p className="text-red-600 text-xs text-center">{errorGoogle}</p>}

            <button
              onClick={manejarRedireccionCorreo}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-100 transition"
            >
              <HiOutlineMail className="text-base" />
              Continuar con correo electrónico
            </button>
          </div>

          <div className="text-sm text-blue-600 text-center pt-4">
            <button
              onClick={() => navigate("/menupage")}
              className="inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              Continuar como invitado
              <span className="text-base">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
