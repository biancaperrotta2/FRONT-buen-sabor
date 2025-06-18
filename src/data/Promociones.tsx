import { Promocion } from "../classes/PromocionClass";
import { tipoPromocion1, tipoPromocion2, tipoPromocion3 } from "../data/TipoPromocion";

export const promo1 = new Promocion(
  "Combo Hamburguesa + Papas + Bebida",
  "2025-06-06",
  "2025-07-06",
  "11:00:00",
  "23:00:00",
  "Incluye una hamburguesa del día,porción de papas y bebida a precio promocional.",
  3500,
  "combos.jpeg",
  tipoPromocion1
);

export const promo2 = new Promocion(
  "Happy Hour de Cervezas",
  "2025-06-06",
  "2025-12-31",
  "17:00:00",
  "20:00:00",
  "Cervezas seleccionadas al 2x1 en horario de happy hour.",
  600,
  "combos.jpeg",
  tipoPromocion2
);

export const promo3 = new Promocion(
  "Combo Hamburguesa Doble",
  "2025-06-06",
  "2025-07-31",
  "12:00:00",
  "22:00:00",
  "Hamburguesa Doble mas papas con $500 de descuento.",
  1900,
  "combos.jpeg",
  tipoPromocion3
);

export const promocion =[ tipoPromocion1,tipoPromocion2, tipoPromocion3 ];
