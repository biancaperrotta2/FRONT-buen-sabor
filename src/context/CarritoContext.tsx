import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";
import type { Domicilio } from "../services/pedidoService";
import { useAuth } from "./AuthContext";

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

// Mismo 10% que aplica Pedido.calcularTotal() en el backend para retiro en tienda.
const PORCENTAJE_DESCUENTO_RETIRO = 0.1;

// El carrito es uno solo para toda la app (AppRoutes) y se guarda en el navegador para que no
// se pierda al cambiar de página o recargar. Es solo una comodidad: el pedido real se arma en
// el backend al confirmar, así que si el almacenamiento falla el carrito arranca vacío.
const CLAVE_ALMACENAMIENTO = "buenSabor.carrito";

interface CarritoGuardado {
  productos: ProductoCarrito[];
  tipoEntrega: "tienda" | "delivery";
}

const leerGuardado = (): CarritoGuardado | null => {
  try {
    const crudo = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (!crudo) return null;
    const datos = JSON.parse(crudo);
    return Array.isArray(datos?.productos) ? datos : null;
  } catch {
    return null;
  }
};

interface ProductoCarrito {
  item: ArticuloMenu;
  cantidad: number;
  idUnico: string;
}

interface CarritoContextType {
  productos: ProductoCarrito[];
  agregarAlCarrito: (item: ArticuloMenu, cantidad: number) => void;
  eliminarProducto: (idUnico: string) => void;
  actualizarCantidad: (idUnico: string, delta: number) => void;
  vaciarCarrito: () => void;
  // "Repetir orden": deja en el carrito exactamente estos productos.
  reemplazarCarrito: (items: { item: ArticuloMenu; cantidad: number }[]) => void;
  // El desplegable del encabezado; vive acá para que otra pantalla pueda abrirlo.
  carritoAbierto: boolean;
  setCarritoAbierto: React.Dispatch<React.SetStateAction<boolean>>;
  subtotal: number;
  total: number;
  // null = todavía no se sabe (delivery elegido pero sin dirección aún, ver Carrito/ModalFactura).
  deliveryCosto: number | null;
  descuentoRetiro: number;
  tipoEntrega: "tienda" | "delivery";
  setTipoEntrega: React.Dispatch<React.SetStateAction<"tienda" | "delivery">>;
  domicilioSeleccionado: Domicilio | null;
  setDomicilioSeleccionado: React.Dispatch<React.SetStateAction<Domicilio | null>>;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return context;
};

const obtenerPrecioUnitario = (item: ArticuloMenu): number => {
  if ("precioPromocional" in item && typeof item.precioPromocional === "number") {
    return item.precioPromocional;
  } else if ("precioVenta" in item && typeof item.precioVenta === "number") {
    return item.precioVenta;
  }
  return 0;
};

export const CarritoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { usuario, cargando } = useAuth();
  const [productos, setProductos] = useState<ProductoCarrito[]>(() => leerGuardado()?.productos ?? []);
  const [tipoEntrega, setTipoEntrega] = useState<"tienda" | "delivery">(() => leerGuardado()?.tipoEntrega ?? "tienda");
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  // Se mantiene aunque el cliente pase de "delivery" a "tienda" y vuelva, para no hacerlo
  // elegir la dirección de nuevo (SelectorDomicilio igual la re-confirma/autoselecciona).
  const [domicilioSeleccionado, setDomicilioSeleccionado] = useState<Domicilio | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify({ productos, tipoEntrega }));
    } catch {
      // Sin almacenamiento (modo privado, bloqueado): el carrito sigue funcionando en memoria.
    }
  }, [productos, tipoEntrega]);

  // Solo un cliente logueado puede agregar productos: al cerrar sesión el carrito se vacía, así
  // el próximo que use el mismo navegador no ve el pedido del anterior.
  useEffect(() => {
    if (!cargando && !usuario) {
      setProductos([]);
      setCarritoAbierto(false);
    }
  }, [usuario, cargando]);

  const agregarAlCarrito = (item: ArticuloMenu, cantidad: number) => {
    const idUnico = `${item.id}-${Date.now()}`;
    setProductos((prev) => [...prev, { item, cantidad, idUnico }]);
  };

  const eliminarProducto = (idUnico: string) => {
    setProductos((prev) => prev.filter((p) => p.idUnico !== idUnico));
  };

  const actualizarCantidad = (idUnico: string, delta: number) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.idUnico === idUnico
          ? { ...p, cantidad: Math.max(1, p.cantidad + delta) }
          : p
      )
    );
  };

  // Se usa después de confirmar un pedido: el backend ya vació el carrito persistido
  // como parte de crearPedido, esto solo limpia el estado local en memoria.
  const vaciarCarrito = () => {
    setProductos([]);
  };

  const reemplazarCarrito = (items: { item: ArticuloMenu; cantidad: number }[]) => {
    const ahora = Date.now();
    setProductos(items.map(({ item, cantidad }, i) => ({ item, cantidad, idUnico: `${item.id}-${ahora}-${i}` })));
  };

  const subtotal = productos.reduce(
    (acc, prod) => acc + obtenerPrecioUnitario(prod.item) * prod.cantidad,
    0
  );

  // null = delivery elegido pero todavía no se sabe la dirección (SelectorDomicilio no cargó o
  // el cliente no tiene ninguna guardada todavía); no se arriesga un número mientras tanto.
  const deliveryCosto =
    tipoEntrega === "delivery" ? domicilioSeleccionado?.costoEnvio ?? null : 0;
  // Mismo 10% que Pedido.calcularTotal() en el backend, sobre el subtotal de productos.
  const descuentoRetiro = tipoEntrega === "tienda" ? Math.round(subtotal * PORCENTAJE_DESCUENTO_RETIRO) : 0;
  const total = subtotal - descuentoRetiro + (deliveryCosto ?? 0);

  return (
    <CarritoContext.Provider
      value={{
        productos,
        agregarAlCarrito,
        eliminarProducto,
        actualizarCantidad,
        vaciarCarrito,
        reemplazarCarrito,
        carritoAbierto,
        setCarritoAbierto,
        subtotal,
        total,
        deliveryCosto,
        descuentoRetiro,
        tipoEntrega,
        setTipoEntrega,
        domicilioSeleccionado,
        setDomicilioSeleccionado,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

