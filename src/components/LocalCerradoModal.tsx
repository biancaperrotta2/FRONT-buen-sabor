import { createPortal } from "react-dom";
import { FiClock } from "react-icons/fi";
import { MdClose } from "react-icons/md";

interface Props {
  horarioApertura: string;
  onClose: () => void;
}

// Figura 24 del enunciado: el local está cerrado y los pedidos quedan deshabilitados hasta que abra.
const LocalCerradoModal = ({ horarioApertura, onClose }: Props) =>
  createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[10000] px-4">
      <div
        className="bg-white rounded-xl p-8 w-[420px] max-w-full relative shadow-xl text-black text-center"
        role="alertdialog"
        aria-labelledby="titulo-local-cerrado"
        aria-describedby="detalle-local-cerrado"
      >
        <button onClick={onClose} className="absolute top-3 right-3" aria-label="Cerrar">
          <MdClose className="text-xl" />
        </button>
        <FiClock className="text-6xl mx-auto text-gray-600 mb-4" aria-hidden="true" />
        <h2 id="titulo-local-cerrado" className="text-2xl font-bold text-gray-700 mb-3">
          Abre a las {horarioApertura.slice(0, 5)}
        </h2>
        <p id="detalle-local-cerrado" className="text-sm text-gray-600 mb-6">
          El restaurante se encuentra cerrado, los pedidos se encuentran deshabilitados hasta el inicio del
          horario de atención.
        </p>
        <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold px-8 py-2 rounded-md">
          Cerrar
        </button>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );

export default LocalCerradoModal;
