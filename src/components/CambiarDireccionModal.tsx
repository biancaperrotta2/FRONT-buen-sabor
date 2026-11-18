import { useState } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import SelectorDomicilio from "./SelectorDomicilio";
import type { Domicilio } from "../services/pedidoService";

interface Props {
  actual: Domicilio | null;
  onGuardar: (domicilio: Domicilio) => void;
  onClose: () => void;
}

// Figura 21 del enunciado: "Cambiar dirección de envío" desde el carrito. La elección recién se
// aplica con "Guardar"; "Añadir nueva dirección" es el formulario del propio selector.
const CambiarDireccionModal = ({ actual, onGuardar, onClose }: Props) => {
  const [elegido, setElegido] = useState<Domicilio | null>(actual);

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[10000] px-4">
      <div
        className="bg-white rounded-xl p-6 w-[420px] max-w-full relative shadow-xl text-black"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cambiar-direccion"
      >
        <button onClick={onClose} className="absolute top-4 right-4" aria-label="Cerrar">
          <MdClose className="text-xl" />
        </button>
        <h2 id="titulo-cambiar-direccion" className="text-lg font-semibold mb-4">
          Cambiar dirección de envío
        </h2>
        <SelectorDomicilio seleccionado={elegido} onSeleccionar={setElegido} />
        <button
          onClick={() => {
            if (elegido) onGuardar(elegido);
            onClose();
          }}
          disabled={!elegido}
          className="w-full mt-4 bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2 rounded-md disabled:opacity-60"
        >
          Guardar
        </button>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default CambiarDireccionModal;
