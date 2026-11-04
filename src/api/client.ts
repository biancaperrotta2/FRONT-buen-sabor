export const API_BASE = "http://localhost:8080";

const TOKEN_KEY = "buensabor_token";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export interface JwtPayload {
  sub: string; // usuario
  id: number;
  rol: string;
  exp: number;
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const isTokenValido = (token: string): boolean => {
  const payload = decodeToken(token);
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
};

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export { ApiError };

export const mensajeDeError = (error: unknown): string => {
  if (error instanceof ApiError) return error.message.replace(/^Solicitud inválida:\s*/, "");
  return "No se pudo completar la operación. Revisá tu conexión e intentá de nuevo.";
};

/**
 * Wrapper de fetch que agrega el header Authorization cuando hay sesión
 * iniciada, y tira ApiError con el texto del backend cuando la respuesta
 * no es ok (para poder mostrar el mensaje real en vez de un "failed to fetch").
 */
export const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const headers = new Headers(options.headers);
  // Con FormData el navegador arma el Content-Type (multipart + boundary); no hay que pisarlo.
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Token vencido, o cuenta desactivada mientras tenía la sesión abierta: se cierra la
  // sesión y se manda a iniciar sesión (el propio /login puede responder 401 y no cuenta).
  if (res.status === 401 && token && !path.startsWith("/login")) {
    clearToken();
    window.location.assign("/login");
  }

  if (!res.ok) {
    let mensaje = `Error ${res.status}`;
    try {
      const cuerpo = await res.clone().json();
      mensaje = cuerpo.message || cuerpo.error || mensaje;
      if (cuerpo.errores && typeof cuerpo.errores === "object") {
        mensaje = `${mensaje}: ${Object.values(cuerpo.errores).join(". ")}`;
      }
    } catch {
      // el backend no devolvió JSON, nos quedamos con el mensaje genérico
    }
    throw new ApiError(res.status, mensaje);
  }

  return res;
};

export const apiFetchJson = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await apiFetch(path, options);
  if (res.status === 204) return undefined as T;
  return res.json();
};
