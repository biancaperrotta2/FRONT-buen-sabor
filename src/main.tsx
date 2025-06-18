import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./AppRoutes.tsx";
import { initMercadoPago } from "@mercadopago/sdk-react";
import { AuthProvider } from "./context/AuthContext"; // 👈 IMPORTANTE

const publicKey = "APP_USR-3ba36729-737f-42ac-a8c0-b38ecf501780";

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
