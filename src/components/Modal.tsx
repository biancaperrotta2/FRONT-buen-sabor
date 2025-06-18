import type { ReactNode } from 'react'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    titulo?: string
    children: ReactNode
    className?: string 
}


    export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, titulo, className, children }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`bg-white rounded-2xl shadow-lg w-full mx-4 animate-fadeIn ${className ?? 'max-w-lg'}`}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">{titulo}</h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-gray-500 hover:text-gray-700 text-xl font-bold"
                        aria-label="Cerrar"
                    >
                        &times;
                    </button>
                </div>

                {/* Contenido con altura fija y scroll */}
                <div className="p-4 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )

}

export default Modal
