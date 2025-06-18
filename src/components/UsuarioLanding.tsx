import type { FC } from "react";

interface Props {
  nombre: string;
  onToggleCarrito: () => void;
}

const UsuarioLanding: FC<Props> = ({ nombre, onToggleCarrito }) => {
  return (
    <div className="text-white cursor-pointer font-semibold tracking-wide" onClick={onToggleCarrito}>
      {nombre.toUpperCase()}
    </div>
  );
};

export default UsuarioLanding;
