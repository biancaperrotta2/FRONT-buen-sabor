import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { Admin } from "./pages/Admin";
import { Categorias } from "./pages/Categorias";
import { Insumos } from "./pages/Insumo";
import { Productos } from "./pages/Productos";
import { CategoriaProvider } from "./context/CategoriaContext";
import { InsumosProvider } from "./context/InsumosContext";
import { ArticuloManufacturados } from "./pages/ArticuloManufacturado";
import { Promociones } from "./pages/Promociones";
import MenuPage from "./pages/Menu";
import { CarritoProvider } from "./context/CarritoContext";
import RegistroFormulario from "./pages/RegistroFormulario";
import Login from "./pages/Login";
import LoginEmail from "./pages/LoginEmail";
import RecuperarContrasena from "./pages/RecuperarContraseña";
import Aprobado from "./pages/Aprobado";
import MisPedidos from "./pages/MisPedidos";
import Semielaborados from "./pages/Semielaborados";
import Repartidor from "./pages/Repartidor";
import Empleados from "./pages/Empleados";
import Clientes from "./pages/Clientes";
import Cocina from "./pages/Cocina";
import Caja from "./pages/Caja";
import Reportes from "./pages/Reportes";
import Facturas from "./pages/Facturas";
import { ProductosProvider } from "./context/ProductosContext";
import ProtectedRoute from "./components/ProtectedRoute";

export const AppRoutes = () => {
  return (
    <CategoriaProvider>
      <InsumosProvider>
        <ProductosProvider>
          <Routes>
            <Route path="/"
                  element={<CarritoProvider> <LandingPage /> </CarritoProvider>}/>
            <Route path="/menupage"
                  element={<CarritoProvider> <MenuPage/> </CarritoProvider>}/>
            <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><Admin /></ProtectedRoute>} />
            <Route path="/registro" element={<RegistroFormulario/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/loginemail" element={<LoginEmail/>} />
            <Route path="/recuperarcontrasena" element={<RecuperarContrasena/>} />
            <Route path="/pago/exito" element={<Aprobado />} />
            <Route path="/pago/pendiente" element={<Aprobado />} />
            <Route path="/pago/error" element={<Aprobado />} />
            <Route path="/mis-pedidos"
                  element={<ProtectedRoute><CarritoProvider><MisPedidos /></CarritoProvider></ProtectedRoute>} />
            <Route path="/repartidor"
                  element={<ProtectedRoute roles={["REPARTIDOR", "ADMIN"]}><Repartidor /></ProtectedRoute>} />
            <Route path="/cocina"
                  element={<ProtectedRoute roles={["COCINERO", "ADMIN"]}><Cocina /></ProtectedRoute>} />
            <Route path="/caja"
                  element={<ProtectedRoute roles={["CAJERO", "ADMIN"]}><Caja /></ProtectedRoute>} />
            <Route path="/categorias" element={<ProtectedRoute roles={["ADMIN"]}><Categorias /></ProtectedRoute>} />
            <Route path="/insumos" element={<ProtectedRoute roles={["ADMIN"]}><Insumos /></ProtectedRoute>} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/semielaborados" element={<ProtectedRoute roles={["ADMIN", "COCINERO"]}><Semielaborados /></ProtectedRoute>} />
            <Route path="/manufacturados" element={<ProtectedRoute roles={["ADMIN"]}><ArticuloManufacturados /></ProtectedRoute>} />
            <Route path="/promociones" element={<ProtectedRoute roles={["ADMIN"]}><Promociones /></ProtectedRoute>} />
            <Route path="/empleados" element={<ProtectedRoute roles={["ADMIN"]}><Empleados /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute roles={["ADMIN"]}><Clientes /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute roles={["ADMIN"]}><Reportes /></ProtectedRoute>} />
            <Route path="/facturas" element={<ProtectedRoute roles={["ADMIN"]}><Facturas /></ProtectedRoute>} />
            <Route path="*" element={<div>Ruta no encontrada</div>} />
          </Routes>
        </ProductosProvider>
      </InsumosProvider>
    </CategoriaProvider>
  );
};

export default AppRoutes;
