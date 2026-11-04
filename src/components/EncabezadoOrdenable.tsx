import type { Direccion } from "../services/paginacion";

interface Props {
  campo: string;
  etiqueta: string;
  ordenarPor: string | null;
  direccion: Direccion;
  onClick: (campo: string) => void;
}

// <th> clicable que cicla entre sin ordenar -> ascendente -> descendente -> sin ordenar,
// mostrando una flechita solo cuando esta columna es la que está activa.
export const EncabezadoOrdenable = ({ campo, etiqueta, ordenarPor, direccion, onClick }: Props) => {
  const activo = ordenarPor === campo;
  return (
    <th
      className="px-6 py-3 cursor-pointer select-none hover:bg-gray-300"
      onClick={() => onClick(campo)}
    >
      {etiqueta}
      {activo && direccion === "asc" && <span className="ml-1">↑</span>}
      {activo && direccion === "desc" && <span className="ml-1">↓</span>}
    </th>
  );
};

export default EncabezadoOrdenable;
