import { Footer } from "../components/Footer";
import NavCategorias from "../components/NavCategorias";
import ContenedorMenu from "../components/ContenedorMenu";
import Header from "../components/Header";

export const MenuPage = () => {
  return (
    <div className="w-full">
      <Header />

      {/* CONTENIDO DEBAJO DEL HEADER */}
      <section className="pt-30 relative min-h-screen bg-fondo-principal bg-cover bg-center bg-no-repeat">
        {/* Capa oscura */}
        <div className="absolute inset-0 bg-black/20 z-0" />

        {/* Contenido principal */}
        <div className="relative z-10 flex flex-col gap-2">
          <NavCategorias />
          <div className="overflow-y-scroll scrollbar-hide h-[600px]">
            <ContenedorMenu />
          </div>
        </div>
      </section>

      {/* Opcionalmente el Footer debajo */}
      <Footer />
    </div>
  );
};

export default MenuPage;