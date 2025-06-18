import React from 'react'


type Boton = {
    tipo?: "submit" | "reset" | "button" | undefined ,
    onClick?: () => void,
    textoBoton?: string,
    estiloBoton?: string
}

export const Boton = ({tipo, onClick, textoBoton, estiloBoton}: Boton) => {
    return (
        <button
            type={tipo}
            onClick={onClick}
            className={`${estiloBoton} cursor-pointer`}
        >
            {textoBoton}
        </button>
    )
}


export default Boton