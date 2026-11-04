import { apiFetchJson } from "../api/client";

export const TAMANIO_MAXIMO_IMAGEN_MB = 5;
export const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

// Devuelve la URL pública de la foto ya subida a Cloudinary.
export async function subirImagen(archivo: File): Promise<string> {
  const datos = new FormData();
  datos.append("archivo", archivo);
  const respuesta = await apiFetchJson<{ url: string }>("/imagenes", {
    method: "POST",
    body: datos,
  });
  return respuesta.url;
}
