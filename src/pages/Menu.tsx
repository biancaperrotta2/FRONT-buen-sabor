import { Footer } from "../components/Footer";
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

        {/* Contenido principal: buscador, categorías y grilla (ver ContenedorMenu) */}
        <div className="relative z-10">
          <ContenedorMenu />
        </div>
      </section>

      {/* Opcionalmente el Footer debajo */}
      <Footer />
    </div>
  );
};

export default MenuPage;
