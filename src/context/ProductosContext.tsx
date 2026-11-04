import React, { createContext, useContext, useEffect, useState } from "react";
import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";
import { Categoria } from "../classes/CategoriaClass";
import { UnidadMedida } from "../classes/UnidadMedidaClass";
import { apiFetchJson } from "../api/client";

export interface DetalleManufacturadoDto {
  idComponente: number;
  cantidad: number;
}

export interface ManufacturadoDto {
  id?: number;
  denominacion: string;
  precioVenta: number;
  descripcion: string;
  tiempoEstimado: number;
  preparacion: string;
  unidadMedida: UnidadMedida | null;
  categoria: Categoria | null;
  imagenUrl?: string | null;
  // Receta: los ingredientes (insumos o semielaborados) que se descuentan del stock en
  // cada venta. Vacía por defecto (un producto sin receta cargada no descuenta stock
  // de nada, ver CLAUDE.md "Receta de productos (ingredientes) — agregada 2026-09-24").
  detalles: DetalleManufacturadoDto[];
}

interface ProductosContextType {
  productos: ArticuloManufacturado[];
  fetchProductos: () => void;
  agregarProducto: (nuevo: ManufacturadoDto) => Promise<void>;
  actualizarProducto: (id: number, actualizado: ManufacturadoDto) => Promise<void>;
  eliminarProducto: (id: number) => Promise<void>;
}

const ProductosContext = createContext<ProductosContextType | undefined>(undefined);

export const useProductos = () => {
  const context = useContext(ProductosContext);
  if (!context) {
    throw new Error("useProductos debe usarse dentro de un ProductosProvider");
  }
  return context;
};

export const mapearBase = (item: any) =>
  new ArticuloManufacturado(
    item.denominacion,
    item.precioVenta,
    item.unidadMedida ?? new UnidadMedida(""),
    item.categoria ?? new Categoria("", null),
    item.descripcion,
    item.tiempoEstimado ?? 0,
    item.preparacion ?? "",
    item.detalles ?? [],
    item.imagenUrl,
    item.activo ?? true,
    item.id
  );

const mapearFull = (item: any) =>
  new ArticuloManufacturado(
    item.denominacion,
    item.precioVenta,
    item.unidadMedida ?? new UnidadMedida(""),
    item.categoria
      ? new Categoria(item.categoria.denominacion ?? item.categoria.nombre, item.categoria.categoriaPadre, item.categoria.id)
      : new Categoria("", null),
    item.descripcion,
    item.tiempoEstimado ?? 0,
    item.preparacion ?? "",
    item.detalles ?? [],
    item.imagenes?.[0]?.url,
    item.activo ?? true,
    item.id
  );

const aRequest = (dto: ManufacturadoDto) => ({
  denominacion: dto.denominacion,
  precioVenta: dto.precioVenta,
  descripcion: dto.descripcion,
  tiempoEstimado: dto.tiempoEstimado,
  preparacion: dto.preparacion,
  imagenes: dto.imagenUrl ? [{ denominacion: dto.denominacion, url: dto.imagenUrl }] : [],
  categoria: dto.categoria
    ? { denominacion: dto.categoria.denominacion, idCategoriaPadre: dto.categoria.id ?? null }
    : null,
  articuloManufacturadoDetalles: dto.detalles.map((d) => ({
    idComponente: d.idComponente,
    cantidad: d.cantidad,
  })),
});

export const ProductosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productos, setProductos] = useState<ArticuloManufacturado[]>([]);

  const fetchProductos = async () => {
    try {
      const data = await apiFetchJson<any[]>("/articulo-manufacturado");
      setProductos(data.map(mapearBase));
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  };

  const agregarProducto = async (nuevo: ManufacturadoDto) => {
    const data = await apiFetchJson<any>("/articulo-manufacturado", {
      method: "POST",
      body: JSON.stringify(aRequest(nuevo)),
    });
    setProductos((prev) => [...prev, mapearFull(data)]);
  };

  const actualizarProducto = async (id: number, actualizado: ManufacturadoDto) => {
    const data = await apiFetchJson<any>(`/articulo-manufacturado/${id}`, {
      method: "PUT",
      body: JSON.stringify(aRequest(actualizado)),
    });
    const productoActualizado = mapearFull(data);
    setProductos((prev) => prev.map((p) => (p.id === id ? productoActualizado : p)));
  };

  const eliminarProducto = async (id: number) => {
    await apiFetchJson(`/articulo-manufacturado/${id}`, { method: "DELETE" });
    setProductos((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  return (
    <ProductosContext.Provider
      value={{ productos, fetchProductos, agregarProducto, actualizarProducto, eliminarProducto }}
    >
      {children}
    </ProductosContext.Provider>
  );
};
