import { useState } from "react";
import { Boton } from "./Boton";
import { ApiError } from "../api/client";
import { crearEmpleado, type RolApi } from "../services/empleadoService";

interface Props {
  onClose: () => void;
  onCreado: () => void;
}

const ROLES: { value: RolApi; label: string }[] = [
  { value: "CAJERO", label: "Cajero" },
  { value: "COCINERO", label: "Cocinero" },
  { value: "REPARTIDOR", label: "Repartidor" },
  { value: "EMPLEADO", label: "Empleado" },
  { value: "ADMIN", label: "Administrador" },
];

export const FormularioEmpleado = ({ onClose, onCreado }: Props) => {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [usuario, setUsuario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolApi>("CAJERO");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await crearEmpleado({ nombre, apellido, usuario, telefono, email, password, rol });
      onCreado();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No pudimos crear el empleado."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="border rounded-md px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
          className="border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <input
        type="text"
        placeholder="Nombre de usuario"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        required
        className="w-full border rounded-md px-3 py-2 text-sm"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full border rounded-md px-3 py-2 text-sm"
      />

      <input
        type="tel"
        placeholder="Teléfono"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        required
        className="w-full border rounded-md px-3 py-2 text-sm"
      />

      <input
        type="password"
        placeholder="Contraseña (mínimo 6 caracteres)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="w-full border rounded-md px-3 py-2 text-sm"
      />

      <select
        value={rol}
        onChange={(e) => setRol(e.target.value as RolApi)}
        className="w-full border rounded-md px-3 py-2 text-sm"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm">
          Cancelar
        </button>
        <Boton
          tipo="submit"
          disabled={guardando}
          textoBoton={guardando ? "Guardando..." : "Crear empleado"}
          estiloBoton="border rounded-md py-2 px-6 font-semibold text-sm bg-[#d6aa7b] text-white hover:bg-[#c69a69] transition disabled:opacity-60"
        />
      </div>
    </form>
  );
};

export default FormularioEmpleado;
