import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../api/client";
import type { Direccion, PageResponse, ParametrosTabla } from "../services/paginacion";

// Hook genérico para toda tabla de admin con búsqueda + paginado + orden reales (el
// backend hace el filtrado/orden/paginado vía Spring Pageable, acá solo se junta el
// estado de la UI y se dispara el fetch cada vez que algo de eso cambia).
export function useTablaServidor<T>(
  fetchFn: (params: ParametrosTabla) => Promise<PageResponse<T>>,
  tamanioPagina = 10
) {
  const [busqueda, setBusquedaInput] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [pagina, setPagina] = useState(0);
  const [ordenarPor, setOrdenarPor] = useState<string | null>(null);
  const [direccion, setDireccion] = useState<Direccion>(null);
  const [datos, setDatos] = useState<PageResponse<T> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce: espera a que el usuario deje de tipear antes de disparar la búsqueda,
  // y vuelve a la primera página (si no, podría quedar "parada" en una página que
  // ya no existe para el nuevo filtro).
  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusquedaAplicada(busqueda);
      setPagina(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  const cargar = useCallback(() => {
    setCargando(true);
    fetchFn({ busqueda: busquedaAplicada, pagina, tamanio: tamanioPagina, ordenarPor, direccion })
      .then((respuesta) => {
        setDatos(respuesta);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "No pudimos cargar los datos."))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaAplicada, pagina, tamanioPagina, ordenarPor, direccion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Cicla de a 3 estados por columna: sin ordenar -> ascendente -> descendente -> sin ordenar.
  const alClickearColumna = (campo: string) => {
    if (ordenarPor !== campo) {
      setOrdenarPor(campo);
      setDireccion("asc");
    } else if (direccion === "asc") {
      setDireccion("desc");
    } else {
      setOrdenarPor(null);
      setDireccion(null);
    }
    setPagina(0);
  };

  return {
    busqueda,
    setBusqueda: setBusquedaInput,
    pagina,
    setPagina,
    ordenarPor,
    direccion,
    alClickearColumna,
    datos,
    cargando,
    error,
    recargar: cargar,
  };
}
