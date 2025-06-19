# Buen Sabor — Frontend 🍔

Este repositorio contiene el **frontend** de la aplicación **Buen Sabor**, una solución web moderna para gestionar pedidos de comida en línea.

---

## 🛠 Tecnologías utilizadas

- **React** con Vite
- **TypeScript**
- **React Router Dom** para navegación entre páginas
- **Axios** para consumo de la API REST
- **React Context** para manejo del estado global (carrito, sesión, etc.)
- **Tailwind CSS** para estilos rápidos y personalizables
- **Lucide React** y otros íconos para UI
- **Shadcn/ui** para componentes accesibles y estilizados

---

## 🚀 Instrucciones de instalación y ejecución

Cloná el repositorio y ejecutá los siguientes comandos:
```bash
git clone https://github.com/biancaperrotta2/FRONT-buen-sabor.git
cd FRONT-buen-sabor
```

# Instalar las dependencias
```bash
npm install
```

# Ejecutar el servidor de desarrollo
```bash
npm run dev
```

## 🌐 Acceso a la aplicación

Accedé a la aplicación desde:  
[http://localhost:5173](http://localhost:5173)

---

## 🏗️ Construcción de la versión de producción

Para construir una versión de producción, ejecutá:
```bash
npm run build
```

## 🔍 Previsualizar la build de producción

Para previsualizar la build de producción, ejecutá:
```bash
npm run preview
```

## 🧩 Descripción general de los módulos implementados

### 📄 Páginas

- **Home**: Página de bienvenida y destacados.
- **Catalogo**: Vista de productos (hamburguesas, bebidas, promociones, etc.).
- **DetalleProducto**: Información detallada del producto seleccionado.
- **Carrito**: Visualización de productos añadidos, con total, subtotal y selección de método de entrega.
- **Login** y **Registro**: Autenticación de usuarios.
- **Confirmación**: Modal al finalizar la orden con detalles de la compra.

---

### 🧠 Contextos globales

- **CarritoContext**: Maneja los productos seleccionados, cantidades, subtotales, tipo de entrega, etc.
- **AuthContext**: Maneja información del usuario logueado y el token.

---

### 🔌 Servicios / API

- **FuncionesAPI.tsx**: Encapsula todas las llamadas HTTP a la API backend.
  - Incluye funciones como `getArticulos`, `getPromociones`, `crearPedido`, etc.

---

### 💳 Componentes reutilizables

- **CardInstrumento**: Muestra cada producto individual con imagen, precio y botón.
- **GridInstrumento**: Arma una grilla de productos por categoría.
- **ModalConfirmacionOrden**: Muestra detalles de la orden y código de compra.
- **Header** y **Footer**: Navegación y pie de página.
- **Boton**, **Input**, **Select**, etc.: Componentes UI reutilizables y estilizados con Tailwind y Shadcn.

---

## 📦 Estructura del repositorio

```bash
/src
│
├── assets/                  # Imágenes y recursos estáticos
├── classes/                 # Clases TypeScript (Artículos, Promociones, etc.)
├── components/              # Componentes reutilizables
│   ├── CardInstrumento.tsx
│   ├── GridInstrumento.tsx
│   ├── ModalConfirmacionOrden.tsx
│   └── ...
│
├── context/                 # Contextos globales
│   ├── CarritoContext.tsx
│   └── AuthContext.tsx
│
├── pages/                   # Páginas principales
│   ├── Home.tsx
│   ├── Catalogo.tsx
│   ├── Carrito.tsx
│   ├── Login.tsx
│   └── ...
│
├── services/
│   └── FuncionesAPI.tsx     # Funciones de conexión con el backend
│
├── App.tsx                  # Componente principal con enrutamiento
├── main.tsx                 # Punto de entrada de la app
└── index.css                # Estilos globales
```
