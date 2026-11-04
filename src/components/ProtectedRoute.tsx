import { useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError, apiFetchJson } from "../api/client";

interface Props {
  children: ReactNode;
  // Si se omite, solo exige estar logueado (comportamiento previo). Si se pasa, además
  // exige que el rol del usuario esté en la lista, confirmado contra el backend.
  roles?: string[];
}

type Verificacion = "verificando" | "permitido" | "denegado";

export const ProtectedRoute = ({ children, roles }: Props) => {
  const { usuario, cargando, logout } = useAuth();
  const [verificacion, setVerificacion] = useState<Verificacion>("verificando");
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  const rolesClave = roles?.join(",") ?? "";

  // El rol del token se decodifica en el navegador sin verificar la firma, así que
  // se puede fabricar. Para rutas con rol, el rol real se consulta al backend.
  useEffect(() => {
    if (!rolesClave || !usuario) return;
    let cancelado = false;
    setVerificacion("verificando");
    apiFetchJson<{ rol: string }>("/sesion")
      .then((sesion) => {
        if (!cancelado) setVerificacion(rolesClave.split(",").includes(sesion.rol) ? "permitido" : "denegado");
      })
      .catch((e) => {
        if (cancelado) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) logoutRef.current();
        setVerificacion("denegado");
      });
    return () => {
      cancelado = true;
    };
  }, [rolesClave, usuario]);

  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (!rolesClave) return <>{children}</>;
  if (verificacion === "verificando") return null;
  if (verificacion === "denegado") return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
