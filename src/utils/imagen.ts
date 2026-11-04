// Las fotos subidas desde el admin llegan como URL completa (Cloudinary); las del sitio
// (banners, categorías) son archivos locales en /assets/img. Sin foto devuelve null.
export const urlDeImagen = (imagen?: string | null): string | null => {
  if (!imagen) return null;
  if (/^https?:\/\//i.test(imagen)) return imagen;
  return `/assets/img/${imagen}`;
};
