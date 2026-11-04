import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./AppRoutes.tsx";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { AuthProvider } from "./context/AuthContext"; // 👈 IMPORTANTE

const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;

initMercadoPago(publicKey, { locale: "es-AR" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider> 
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
