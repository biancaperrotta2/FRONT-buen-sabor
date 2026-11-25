import { useEffect } from "react";

interface Props {
  mensaje: string | null;
  onCerrar: () => void;
}

// Aviso breve abajo de la pantalla (enunciado: Snack Bar "Se ha actualizado el estado").
const SnackBar = ({ mensaje, onCerrar }: Props) => {
  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(onCerrar, 3500);
    return () => clearTimeout(t);
  }, [mensaje, onCerrar]);

  if (!mensaje) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] bg-gray-800 text-white text-sm px-5 py-3 rounded-md shadow-lg"
    >
      {mensaje}
    </div>
  );
};

export default SnackBar;
