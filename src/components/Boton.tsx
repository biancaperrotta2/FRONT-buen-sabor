import React from 'react'


type Boton = {
    tipo?: "submit" | "reset" | "button" | undefined ,
    onClick?: () => void,
    textoBoton?: string,
    estiloBoton?: string,
    disabled?: boolean
}

export const Boton = ({tipo, onClick, textoBoton, estiloBoton, disabled}: Boton) => {
    return (
        <button
            type={tipo}
            onClick={onClick}
            disabled={disabled}
            className={`${estiloBoton} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
            {textoBoton}
        </button>
    )
}


export default Boton