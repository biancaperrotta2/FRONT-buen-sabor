import { Boton } from "../components/Boton";
import { CardLanding } from "../components/CardLanding";
import { Footer } from "../components/Footer";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full">
      {/* SECCION PRINCIPAL */}
      <section
        id="inicio"
        className="relative h-190 bg-fondo-principal bg-cover bg-center bg-no-repeat "
      >
        <div className="pt-50 absolute inset-0 bg-black/30 z-0">
          <div className="h-full relative z-10 flex flex-col gap-40">
            <Header></Header>
            <div className="flex flex-col gap-20">
              <div className="relative flex flex-col gap-4 text-white text-5xl text-center items-center justify-center font-semibold">
                <span>EL BUEN SABOR</span>
                <span>CASERO & DELICIOSO</span>
                <span className="absolute transform left-1/2 -translate-x-1/2 translate-y-10 bottom-0 bg-white h-0.5 w-20"></span>
              </div>
              <div className="flex justify-center text-white ">
                <span className="hover:scale-106 hover:font-semibold transition-all duration-300 ease-in-out">
                  Hamburguesas estilo gourmet caseras, pensadas para vos.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* SECCION PROMOS Y BEBIDAS */}
      <section className="h-90 flex">
        <div className="relative w-1/2 bg-fondo-promo bg-cover bg-no-repeat bg-center">
          <div className="absolute inset-0 bg-black/30 z-0">
            <div className="h-full relative z-10 flex justify-center items-center">
              <div className="flex flex-col items-center gap-6">
                <img
                  src="/assets/icon/iconoPromo.png"
                  alt="iconoPromos"
                  className="w-14 h-14"
                />
                <span className="text-white text-3xl font-bold">PROMOS</span>
                <Boton
                  textoBoton={"MAS"}
                  onClick={() => navigate("/menupage")}
                  estiloBoton={
                    "text-white font-semibold border-1 border-white py-2 px-18 text-lg hover:bg-black transition-all duration-300 ease-in-out tracking-wider"
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <div className="relative w-1/2 bg-fondo-bebida bg-cover bg-no-repeat bg-center">
          <div className="absolute inset-0 bg-black/30 z-0">
            <div className="h-full relative z-10 flex justify-center items-center">
              <div className="flex flex-col items-center gap-5">
                <img
                  src="/assets/icon/iconoBebidas.png"
                  alt="iconoBebidas"
                  className="w-14 h-14"
                />
                <span className="text-white text-3xl font-bold">BEBIDAS</span>
                <Boton
                  textoBoton={"MAS"}
                  onClick={() => navigate("/menupage")}
                  estiloBoton={
                    "text-white font-semibold border-1 border-white py-2 px-18 text-lg hover:bg-black transition-all duration-300 ease-in-out tracking-wider"
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* SECCION SOBRE NOSOTROS */}
      <section id="nosotros" className="h-480">
        {/* PARTE SOBRE EL LOCAL */}
        <div className="h-120 flex justify-center">
          <div className="h-full lg:w-220 md:w-180 sm:w-160 flex flex-col justify-center items-center gap-18">
            <div className="relative flex flex-col items-center text-[#666] text-5xl font-semibold tracking-widest gap-4">
              <span>EL BUEN SABOR</span>
              <span>BURGER HAUS</span>
              <span className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-8 bg-[#666] h-0.5 w-20 "></span>
            </div>
            <p className="text-center text-black font-medium hover:font-bold transition-all duration-300 ease-in-out">
              Somos más que una hamburguesería, somos una experiencia
              gastronómica en Mendoza. En cada bocado, fusionamos ingredientes
              de calidad, creatividad y pasión por la comida. Creemos en los
              momentos compartidos, en las risas con amigos y en esa sensación
              de felicidad cuando pruebas algo increíble. Así que ven, rompé la
              rutina y mordé la diferencia. Bienvenido a tu nueva hamburguesería
              favorita.
            </p>
          </div>
        </div>
        {/* PARTE MENU HAMBURGUESAS */}
        <div className="relative h-116 grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-20 place-items-center px-12">
          <div className="absolute inset-0 bg-black/40 z-0">
            <div className="h-full relative z-10 flex flex-col justify-center items-center gap-8">
              <div className="flex gap-2 items-center justify-center">
                <hr className="text-white h-0.5 w-10" />
                <span className="text-white text-smt font-semibold">
                  CONOCE NUESTRAS
                </span>
                <hr className="text-white h-0.5 w-10" />
              </div>
              <span className="text-white font-bold text-3xl tracking-widest">
                HAMBURGUESAS
              </span>
              <Boton
                textoBoton={"MENU"}
                onClick={() => navigate("/menupage")}
                estiloBoton={
                  "text-white font-semibold border-1 border-white py-2 px-18 text-lg hover:bg-black transition-all duration-300 ease-in-out tracking-wider"
                }
              />
            </div>
          </div>
          <CardLanding
            imagen={"hamburguesaInfo2"}
            info={"HAMBURGUESA DE CERDO, PARMESANO, GUACAMOLE"}
            titulo={"PORKTOR"}
          ></CardLanding>
          <CardLanding
            imagen={"hamburguesaInfo3"}
            info={"HAMBURGUESA DE CARNE, QUESO DE CABRA Y PANCETA"}
            titulo={"BROOKLYN"}
          ></CardLanding>
          <CardLanding
            imagen={"hamburguesaInfo4"}
            info={"HAMBURGUESA DE CORDERO, QUESO DE CABRA Y TOMATE CONFITADO"}
            titulo={"LAMB HAUS"}
          ></CardLanding>
          <CardLanding
            imagen={"hamburguesaInfo5"}
            info={"SANDWICH DE CHORIZO ALEMÁN"}
            titulo={"TASTY SCHWASTAIGER"}
          ></CardLanding>
          <CardLanding
            imagen={"hamburguesaInfo6"}
            info={"HAMBURGUESA VEGETARIANA DE QUINOA, QUESO DAMBO Y MORRONES"}
            titulo={"VEGGIE BURGER"}
          ></CardLanding>
        </div>
        {/* PARTE SOBRE EL STAFF */}
        <div className="h-240 flex justify-center items-center flex-col gap-16">
          <div className="flex gap-2 items-center justify-center">
            <hr className="text-[#666] h-0.5 w-10" />
            <span className="text-[#666] text-smt font-semibold">
              CONOCENOS
            </span>
            <hr className="text-[#666] h-0.5 w-10" />
          </div>
          <div>
            <div className="relative flex flex-col items-center text-[#666] text-5xl font-semibold tracking-widest gap-4">
              <span>NUESTRO STAFF</span>
              <span className="absolute left-1/2 transform -translate-x-1/2 bottom-0 translate-y-6 bg-[#666] h-0.5 w-20 "></span>
            </div>
          </div>
          <div className="w-160 h-86 bg-fondo-staff bg-center bg-no-repeat bg-cover"></div>
          <div className="flex flex-col text-center w-200 gap-4">
            <p className="text-black font-medium hover:font-bold transition-all duration-300 ease-in-out">
              Nos especializamos en creación de productos gourmet, donde la
              prioridad esta puesta en la calidad como en la elección de los
              mejores productos frescos y naturales, sin agregado de
              conservantes ni colorantes. Nuestro chef desarrolló una receta de
              hamburguesas gourmet de estilo casero, llenas de sabor, pan de
              elaboración propia y salsas especiales.
            </p>
            <span className="text-black font-medium hover:font-bold transition-all duration-300 ease-in-out">
              En <b>EL BUEN SABOR</b> estamos en esos pequeños detalles,
              brindándote una cálida experiencia para que te sientas comiendo en
              casa.
            </span>
          </div>
        </div>
      </section>
      {/* SECCION PARA VOLVER ARRIBA */}
      <section className="h-30 flex justify-center items-center bg-gray-200">
        <div>
          <Boton
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            textoBoton={"IR ARRIBA"}
            estiloBoton={
              "text-black font-semibold border-1 border-black py-2 px-18 text-lg hover:bg-black hover:text-white transition-all duration-300 ease-in-out tracking-wider"
            }
          ></Boton>
        </div>
      </section>
      {/* SECCION INFERIOR FOOTER */}
      <div id="footer">
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
