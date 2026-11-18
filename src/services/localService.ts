import { apiFetchJson } from "../api/client";

// Datos públicos del local (GET /local): dirección para "¿Cómo llegar?" y horario para el aviso
// de local cerrado. horario* vienen como "18:00:00".
export interface Local {
  nombre: string;
  direccion: string | null;
  horarioApertura: string;
  horarioCierre: string;
  abiertoAhora: boolean;
}

export function obtenerLocal(): Promise<Local> {
  return apiFetchJson<Local>("/local");
}

export const urlComoLlegar = (direccion: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
