interface Props {
  pagina: number; // 0-based
  totalPaginas: number;
  totalElementos: number;
  tamanio: number;
  onCambiarPagina: (pagina: number) => void;
}

// Ir a primera / anterior / siguiente / última página, más el conteo "x-y de z" que
// pide la consigna de referencia para las tablas de admin.
export const Paginador = ({ pagina, totalPaginas, totalElementos, tamanio, onCambiarPagina }: Props) => {
  if (totalElementos === 0) {
    return null;
  }

  const desde = pagina * tamanio + 1;
  const hasta = Math.min((pagina + 1) * tamanio, totalElementos);
  const esPrimera = pagina <= 0;
  const esUltima = pagina >= totalPaginas - 1;

  const botonClase =
    "cursor-pointer px-3 py-1.5 rounded-md border text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100";

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-gray-600">
      <span>
        {desde}–{hasta} de {totalElementos}
      </span>
      <div className="flex gap-1">
        <button className={botonClase} disabled={esPrimera} onClick={() => onCambiarPagina(0)}>
          «
        </button>
        <button className={botonClase} disabled={esPrimera} onClick={() => onCambiarPagina(pagina - 1)}>
          ‹
        </button>
        <button className={botonClase} disabled={esUltima} onClick={() => onCambiarPagina(pagina + 1)}>
          ›
        </button>
        <button
          className={botonClase}
          disabled={esUltima}
          onClick={() => onCambiarPagina(totalPaginas - 1)}
        >
          »
        </button>
      </div>
    </div>
  );
};

export default Paginador;
