import React from "react";

type NavCategoria = {
  nombre: string;
  imagen: string;
  anchor: string;
};

const navCategorias: NavCategoria[] = [
  { nombre: "Combos", imagen: "assets/img/combos.jpeg", anchor: "#combos" },
  {
    nombre: "Hamburguesas",
    imagen: "assets/img/hamburguesaInfo.jpeg",
    anchor: "#hamburguesas",
  },
  { nombre: "Agregados", imagen: "assets/img/agregados.jpeg", anchor: "#agregados" },
  { nombre: "Papas", imagen: "assets/img/papas.jpeg", anchor: "#papas" },
  { nombre: "Bebidas", imagen: "assets/img/bebidas.jpeg", anchor: "#bebidas" },
  { nombre: "Cervezas", imagen: "assets/img/cervezas.jpeg", anchor: "#cervezas" },
];
const NavCategorias: React.FC = () => {
  return (
    <nav className="flex justify-center gap-10 px-6 py-4 mx-auto w-full max-w-6xl rounded-xl bg-white/70 backdrop-blur-md shadow-md mt-6">
      {navCategorias.map((cat) => (
        <a
          key={cat.nombre}
          href={cat.anchor}
          className="flex flex-col items-center w-24 hover:scale-105 transition-transform"
        >
          <img
            src={cat.imagen}
            alt={cat.nombre}
            className="h-25 w-25 object-cover rounded-md mb-2 border border-gray-300 shadow-sm"
          />
          <span className="text-sm text-black font-semibold tracking-wide">{cat.nombre}</span>
        </a>
      ))}
    </nav>
  );
};

export default NavCategorias;
