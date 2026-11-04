import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  apiFetchJson,
  clearToken,
  decodeToken,
  getToken,
  isTokenValido,
  setToken as guardarToken,
} from "../api/client";
import { iniciarSesionConFirebase } from "../services/authFirebaseService";

interface Usuario {
  nombre: string;
  usuario: string;
  rol: string;
}

interface AuthContextProps {
  usuario: Usuario | null;
  cargando: boolean;
  // Devuelven el Usuario recién logueado (no solo lo guardan en el contexto): el
  // llamador a veces necesita el rol al instante, ej. para redirigir según el rol
  // sin esperar al próximo render.
  login: (email: string, password: string) => Promise<Usuario>;
  loginConFirebase: (email: string, password: string) => Promise<Usuario>;
  loginConGoogle: (idToken: string) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token && isTokenValido(token)) {
      const payload = decodeToken(token);
      if (payload) {
        setUsuario({ nombre: payload.sub, usuario: payload.sub, rol: payload.rol });
      }
    } else {
      clearToken();
    }
    setCargando(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetchJson<{ token: string }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    guardarToken(data.token);
    const payload = decodeToken(data.token);
    if (!payload) throw new Error("Token inválido");
    const usuarioLogueado = { nombre: payload.sub, usuario: payload.sub, rol: payload.rol };
    setUsuario(usuarioLogueado);
    return usuarioLogueado;
  };

  // Se usa cuando el login normal falla para un usuario que reseteó su
  // contraseña con "¿Olvidaste tu contraseña?" (esa contraseña nueva vive en
  // Firebase, no en nuestra base, hasta que inicie sesión al menos una vez así).
  const loginConFirebase = async (email: string, password: string) => {
    const token = await iniciarSesionConFirebase(email, password);
    guardarToken(token);
    const payload = decodeToken(token);
    if (!payload) throw new Error("Token inválido");
    const usuarioLogueado = { nombre: payload.sub, usuario: payload.sub, rol: payload.rol };
    setUsuario(usuarioLogueado);
    return usuarioLogueado;
  };

  // El idToken lo entrega Google Identity Services en el navegador (no es nuestro JWT);
  // el backend lo verifica contra Google y devuelve nuestro propio token, igual que /login.
  const loginConGoogle = async (idToken: string) => {
    const data = await apiFetchJson<{ token: string }>("/login/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
    guardarToken(data.token);
    const payload = decodeToken(data.token);
    if (!payload) throw new Error("Token inválido");
    const usuarioLogueado = { nombre: payload.sub, usuario: payload.sub, rol: payload.rol };
    setUsuario(usuarioLogueado);
    return usuarioLogueado;
  };

  const logout = () => {
    clearToken();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, loginConFirebase, loginConGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
