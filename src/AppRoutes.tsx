import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { Admin } from "./pages/Admin";
import { Categorias } from "./pages/Categorias";
import { Insumos } from "./pages/Insumo";
import { Productos } from "./pages/Productos";
import { CategoriaProvider } from "./context/CategoriaContext";
import { InsumosProvider } from "./context/InsumosContext";
import { ArticuloManufacturados } from "./pages/ArticuloManufacturado";
import MenuPage from "./pages/Menu";
import { CarritoProvider } from "./context/CarritoContext";
import RegistroFormulario from "./pages/RegistroFormulario";
import Login from "./pages/Login";
import LoginEmail from "./pages/LoginEmail";
import RecuperarContrasena from "./pages/RecuperarContraseña";

export const AppRoutes = () => {
  return (
    <CategoriaProvider>
      <InsumosProvider>
        <Routes>
          <Route path="/" 
                element={<CarritoProvider> <LandingPage /> </CarritoProvider>}/>
          <Route path="/menupage"
                element={<CarritoProvider> <MenuPage/> </CarritoProvider>}/>
          <Route path="/admin" element={<Admin />} />
          <Route path="/registro" element={<RegistroFormulario/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/loginemail" element={<LoginEmail/>} />
          <Route path="/recuperarcontrasena" element={<RecuperarContrasena/>} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/insumos" element={<Insumos />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/manufacturados" element={<ArticuloManufacturados />} />
          <Route path="*" element={<div>Ruta no encontrada</div>} />
        </Routes>
      </InsumosProvider>
    </CategoriaProvider>
  );
};

export default AppRoutes;
