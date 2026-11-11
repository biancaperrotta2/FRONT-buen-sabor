// Pantalla de inicio de cada empleado (enunciado, historia "Iniciar sesión"): Repartidor →
// Entregas, Cajero → Órdenes, Cocinero → Cocina, Administrador → Administración. Un cliente (o
// cualquier otro rol) no tiene panel propio y sigue a la tienda.
const PANEL_POR_ROL: Record<string, string> = {
  ADMIN: "/admin",
  CAJERO: "/caja",
  COCINERO: "/cocina",
  REPARTIDOR: "/repartidor",
};

export const panelDelRol = (rol: string | undefined): string | null =>
  (rol && PANEL_POR_ROL[rol]) || null;

export const rutaInicioSegunRol = (rol: string | undefined): string => panelDelRol(rol) ?? "/";
