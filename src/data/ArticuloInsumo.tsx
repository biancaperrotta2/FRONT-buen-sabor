import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { bebidas, cervezas } from "./Categoria";
import { litro } from "./UnidadMedida";

const cocaCola = new ArticuloInsumo(
  "Coca-Cola 500ml",
  500,
  litro,
  bebidas,
  300,
  100,
  200,
  false,
  "coca500ml.jpg"
);

const sprite = new ArticuloInsumo(
  "Sprite 500ml",
  500,
  litro,
  bebidas,
  290,
  100,
  200,
  false,
  "sprite500ml.jpg"
);

const agua = new ArticuloInsumo(
  "Agua Mineral 500ml",
  400,
  litro,
  bebidas,
  200,
  100,
  200,
  false,
  "agua500ml.webp"
);

const quilmes = new ArticuloInsumo(
  "Cerveza Quilmes 500ml",
  600,
  litro,
  cervezas,
  400,
  80,
  150,
  false,
  "quilmes500ml.webp"
);

const heineken = new ArticuloInsumo(
  "Cerveza Heineken 500ml",
  700,
  litro,
  cervezas,
  500,
  80,
  150,
  false,
  "heineken500ml.avif"
);

const imperial = new ArticuloInsumo(
  "Cerveza Imperial 500ml",
  650,
  litro,
  cervezas,
  450,
  80,
  150,
  false,
  "Imperial500ml.jpg"
);

export const bebida = [sprite, cocaCola, agua];
export const cerveza = [quilmes, heineken, imperial];
