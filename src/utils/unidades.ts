// Mismo factor que UnidadMedidaEnum en el backend (ver Articulo.convertirACantidadBase): cuánto
// vale 1 de esta unidad en la unidad base (Kilos / Litros / Unidad). Se usa solo para mostrar
// conversiones en los formularios; la conversión real la hace el backend al guardar.
const FACTOR_POR_UNIDAD: Record<string, number> = {
  gramo: 0.001, gramos: 0.001, gr: 0.001, g: 0.001,
  kilo: 1, kilos: 1, kilogramo: 1, kilogramos: 1, kg: 1, kil: 1,
  mililitro: 0.001, mililitros: 0.001, ml: 0.001, mil: 0.001,
  litro: 1, litros: 1, l: 1, lt: 1, lit: 1,
  unidad: 1, unidades: 1, un: 1, uni: 1,
};

// null si la unidad no se reconoce: en ese caso mejor no convertir nada que convertir mal.
export function factorDeUnidad(denominacion: string | null | undefined): number | null {
  if (!denominacion) return null;
  const normalizado = denominacion
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return FACTOR_POR_UNIDAD[normalizado] ?? null;
}

// Pasa una cantidad expresada en una unidad a otra (ej. 250 Gramos -> 0.25 Kilos).
export function convertirCantidad(valor: number, factorOrigen: number, factorDestino: number): number {
  return Math.round(((valor * factorOrigen) / factorDestino) * 1_000_000) / 1_000_000;
}
