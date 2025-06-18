import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { hamburguesas, papas, agregados} from "./Categoria";
import { gramo, unidad } from "./UnidadMedida";

const hamburguesaClasica = new ArticuloManufacturado(
  "Hamburguesa Clásica",
  1200,
  unidad,
  hamburguesas,
  "Pan, carne, lechuga y tomate",
  10,
  "Grillar carne, armar con vegetales.",
  [], "hamburguesaInfo.jpeg"
);

const hamburguesaDoble = new ArticuloManufacturado(
  "Hamburguesa Doble",
  1600,
  unidad,
  hamburguesas,
  "Doble carne, queso, lechuga y tomate",
  12,
  "Grillar carne doble, montar.",
  [], "hamburguesaInfo2.jpeg"
);

const hamburguesaCheddar = new ArticuloManufacturado(
  "Hamburguesa Cheddar",
  1500,
  unidad,
  hamburguesas,
  "Carne, queso cheddar, cebolla caramelizada",
  11,
  "Grillar y armar.",
  [], "hamburguesaInfo3.jpeg"
);

const hamburguesaBacon = new ArticuloManufacturado(
  "Hamburguesa Bacon",
  1700,
  unidad,
  hamburguesas,
  "Bacon, cheddar, carne y huevo",
  13,
  "Grillar carne, freír huevo y montar.",
  [], "hamburguesaInfo4.jpeg"
);

const hamburguesaVeggie = new ArticuloManufacturado(
  "Hamburguesa Veggie",
  1300,
  unidad,
  hamburguesas,
  "Medallón vegetal, palta, tomate",
  10,
  "Armar con vegetales y planchar pan.",
  [], "hamburguesaInfo5.jpeg"
);

const hamburguesaPicante = new ArticuloManufacturado(
  "Hamburguesa Picante",
  1550,
  unidad,
  hamburguesas,
  "Carne, salsa picante, jalapeños",
  12,
  "Grillar y montar con picante.",
  [], "hamburguesaInfo6.jpeg"
);

const papasClasicas = new ArticuloManufacturado(
  "Papas Clásicas",
  800,
  gramo,
  papas,
  "Papas bastón fritas",
  5,
  "Freír y salar.",
  [], "papasClasicas.jpg"
);

const papasCheddar = new ArticuloManufacturado(
  "Papas con Cheddar",
  1000,
  gramo,
  papas,
  "Papas con queso cheddar derretido",
  6,
  "Freír, derretir queso.",
  [], "papasConCheddar.jpg"
);

const papasConBacon = new ArticuloManufacturado(
  "Papas con Cheddar y Bacon",
  1100,
  gramo,
  papas,
  "Papas fritas con queso cheddar y panceta",
  6,
  "Freír papas y panceta.",
  [], "papasConCheddarYBacon.jpg"
);

const arosCebolla = new ArticuloManufacturado(
  "Aros de Cebolla",
  1000,
  gramo,
  agregados,
  "Aros de cebolla rebozados",
  6,
  "Freir aros de cebolla.",
  [], "aroDeCebolla.jpg"
);

const nuggets = new ArticuloManufacturado(
  "Nuggets de Pollo",
  1700,
  gramo,
  agregados,
  "Nuggets de pollo crujientes",
  4,
  "Freir nuggets.",
  [], "nuggets.jpg"
);

export const hamburguesa = [
  hamburguesaClasica,
  hamburguesaDoble,
  hamburguesaCheddar,
  hamburguesaBacon,
  hamburguesaVeggie,
  hamburguesaPicante,
];

export const papa = [
  papasClasicas,
  papasCheddar,
  papasConBacon
];

export const agregado = [
  arosCebolla,
  nuggets
];