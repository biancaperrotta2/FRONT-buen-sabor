import React from "react";
import UsuarioLanding from "../components/UsuarioLanding";
import Header from "../components/Header";
import NavCategorias from "../components/NavCategorias";
import ContenedorMenu from "../components/ContenedorMenu";
import Footer from "../components/Footer";
import CarritoDesplegable from "../components/CarritoDesplegable";

export const Productos = () => {
  return (
    <div className="w-full">
      {/* SECCION PRINCIPAL */}
      <section className="relative h-190 bg-fondo-principal bg-cover bg-center bg-no-repeat ">
        <div className="absolute inset-0 bg-black/30 z-0">
          <div className="h-full relative z-10 flex flex-col gap-2">
            <Header />
          </div>
        </div>
      </section>
    </div>
  );
};
