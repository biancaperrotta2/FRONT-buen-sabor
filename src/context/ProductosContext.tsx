    import React, { createContext, useContext, useEffect, useState } from "react";
    import { ArticuloManufacturado } from "../classes/ArticuloManufacturadoClass";

    // Tipo del contexto
    interface ProductosContextType {
    productos: ArticuloManufacturado[];
    fetchProductos: () => void;
    agregarProducto: (nuevo: ArticuloManufacturado) => Promise<void>;
    actualizarProducto: (id: number, actualizado: ArticuloManufacturado) => Promise<void>;
    eliminarProducto: (id: number) => Promise<void>;
    }

    // Crear contexto
    const ProductosContext = createContext<ProductosContextType | undefined>(undefined);

    // Hook para acceder al contexto
    export const useProductos = () => {
    const context = useContext(ProductosContext);
    if (!context) {
        throw new Error("useProductos debe usarse dentro de un ProductosProvider");
    }
    return context;
    };

    // Provider
    export const ProductosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [productos, setProductos] = useState<ArticuloManufacturado[]>([]);

    const fetchProductos = async () => {
        try {
        const res = await fetch("http://localhost:8080/articulo-manufacturado");
        const data = await res.json();
        const instancias = data.map((item: any) => 
            new ArticuloManufacturado(
            item.id,
            item.denominacion,
            item.precioVenta,
            item.descripcion,
            item.tiempoEstimado,
            item.preparacion,
            item.unidadMedida,
            item.categoria,
            item.articuloManufacturadoDetalles
            )
        );
        setProductos(instancias);
        } catch (error) {
        console.error("Error al obtener productos:", error);
        }
    };

    const agregarProducto = async (nuevo: ArticuloManufacturado) => {
        try {
        const res = await fetch("http://localhost:8080/articulo-manufacturado", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevo),
        });
        if (!res.ok) throw new Error("Error al agregar producto");
        const data = await res.json();
        const nuevoProducto = new ArticuloManufacturado(
            data.id,
            data.denominacion,
            data.precioVenta,
            data.descripcion,
            data.tiempoEstimado,
            data.preparacion,
            data.unidadMedida,
            data.categoria,
            data.articuloManufacturadoDetalles
        );
        setProductos((prev) => [...prev, nuevoProducto]);
        } catch (error) {
        console.error("Error al agregar producto:", error);
        }
    };

    const actualizarProducto = async (id: number, actualizado: ArticuloManufacturado) => {
        try {
        const res = await fetch(`http://localhost:8080/articulo-manufacturado/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actualizado),
        });
        if (!res.ok) throw new Error("Error al actualizar producto");
        await res.json();
        setProductos((prev) =>
            prev.map((p) => (p.id === id ? { ...actualizado, id } : p))
        );
        } catch (error) {
        console.error("Error al actualizar producto:", error);
        }
    };

    const eliminarProducto = async (id: number) => {
        try {
        const res = await fetch(`http://localhost:8080/articulo-manufacturado/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("Error al eliminar producto");
        setProductos((prev) => prev.filter((p) => p.id !== id));
        } catch (error) {
        console.error("Error al eliminar producto:", error);
        }
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
