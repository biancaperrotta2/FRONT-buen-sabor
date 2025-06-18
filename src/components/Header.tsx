import { useNavigate, useLocation } from "react-router-dom";
import CarritoDesplegable from "../components/CarritoDesplegable";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuth();
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [menuUsuarioVisible, setMenuUsuarioVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNosotrosClick = () => {
    if (location.pathname === "/") {
      scrollToSection("nosotros");
    } else {
      navigate("/", { replace: false });
      setTimeout(() => scrollToSection("nosotros"), 100);
    }
  };

  const handleContactoClick = () => {
    if (location.pathname === "/") {
      scrollToSection("footer");
    } else {
      navigate("/", { replace: false });
      setTimeout(() => scrollToSection("footer"), 100);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuUsuarioVisible(false);
      }
    };
    if (menuUsuarioVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuUsuarioVisible]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center h-30 px-6 bg-black/70 backdrop-blur-md">
      <div
        onClick={() => navigate("/")}
        className="text-white text-2xl md:text-3xl font-bold tracking-wide hover:scale-105 transition-transform duration-300 cursor-pointer"
      >
        EL BUEN SABOR
      </div>

      <div className="flex gap-10 text-white font-semibold tracking-widest text-sm md:text-base lg:text-lg items-end">
        <span onClick={handleNosotrosClick} className="relative group cursor-pointer">
          NOSOTROS
          <span className="absolute left-0 bottom-0 bg-white h-0.5 w-full scale-x-0 transform origin-center transition-all duration-300 ease-in-out group-hover:scale-x-100"></span>
        </span>
        <span onClick={() => navigate("/menupage")} className="relative group cursor-pointer">
          BURGERS
          <span className="absolute left-0 bottom-0 bg-white h-0.5 w-full scale-x-0 transform origin-center transition-all duration-300 ease-in-out group-hover:scale-x-100"></span>
        </span>
        <span onClick={handleContactoClick} className="relative group cursor-pointer">
          CONTACTO
          <span className="absolute left-0 bottom-0 bg-white h-0.5 w-full scale-x-0 transform origin-center transition-all duration-300 ease-in-out group-hover:scale-x-100"></span>
        </span>
      </div>

      <div className="flex gap-4 items-center relative">
        {usuario ? (
          <>
            <div className="relative inline-flex items-center" ref={menuRef}>
              <button
                onClick={() => setMenuUsuarioVisible((v) => !v)}
                className="flex items-center gap-1 px-4 py-1 text-sm font-medium text-white border border-white rounded-md hover:bg-white hover:text-black transition"
                aria-haspopup="true"
                aria-expanded={menuUsuarioVisible}
                type="button"
              >
                {usuario.nombre}
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    menuUsuarioVisible ? "rotate-180" : "rotate-0"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuUsuarioVisible && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-black/90 border border-gray-600 rounded-md shadow-lg z-50">
                  <button
                    onClick={() => {
                      logout();
                      setMenuUsuarioVisible(false);
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 transition"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMostrarCarrito((prev) => !prev)}
              className="text-white bg-[#d6aa7b] px-3 py-1 rounded hover:bg-[#c69a69] transition"
              aria-label="Abrir carrito"
            >
              🛒
            </button>

            {mostrarCarrito && <CarritoDesplegable />}
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/registro")}
              className="px-4 py-1 text-sm font-medium text-white border border-white rounded-md hover:bg-white hover:text-black transition"
            >
              Registrar
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-1 text-sm font-medium text-white border border-white rounded-md hover:bg-white hover:text-black transition"
            >
              Ingresar
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
