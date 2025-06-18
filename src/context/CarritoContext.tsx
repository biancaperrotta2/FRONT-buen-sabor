import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { ArticuloInsumo } from "../classes/ArticuloInsumoClass";
import { Promocion } from "../classes/PromocionClass";

type ArticuloMenu = ArticuloManufacturado | ArticuloInsumo | Promocion;

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
  subtotal: number;
  total: number;
  deliveryCosto: number;
  tipoEntrega: "tienda" | "delivery";
  setTipoEntrega: React.Dispatch<React.SetStateAction<"tienda" | "delivery">>;
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
  const [productos, setProductos] = useState<ProductoCarrito[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<"tienda" | "delivery">("tienda");

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

  const subtotal = productos.reduce(
    (acc, prod) => acc + obtenerPrecioUnitario(prod.item) * prod.cantidad,
    0
  );

  const deliveryCosto = tipoEntrega === "delivery" ? 1000 : 0;
  const total = subtotal + deliveryCosto;

  return (
    <CarritoContext.Provider
      value={{
        productos,
        agregarAlCarrito,
        eliminarProducto,
        actualizarCantidad,
        subtotal,
        total,
        deliveryCosto,
        tipoEntrega,
        setTipoEntrega,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

