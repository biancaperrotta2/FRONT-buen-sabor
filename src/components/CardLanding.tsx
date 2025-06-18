import React from 'react'

type CardLanding = {
    info: string,
    titulo: string,
    imagen: string
}

export const CardLanding = ({info, titulo, imagen}: CardLanding) => {
    return (
        <div className='h-116 w-76 bg-zinc-900 shadow-xl'>
            <img src={`/assets/img/${imagen}.jpeg`} alt="hamburguesaInfo" />
            <div className='flex flex-col items-center justify-center py-6 px-4'>
                <div className='w-full h-10 flex items-center justify-center'>
                    <span className='text-white text-center text-sm'>
                        {info}
                    </span>
                </div>
                  {/* Dejar el hr solo */}
                <div className='flex justify-center'>
                    <hr className='bg-[#C68F4D] w-20 h-1 m-4' />
                </div>
                <div className='h-10 flex flex-col items-center justify-center'>
                    <span className='text-[#C68F4D] font-semibold text-lg'>
                        {titulo}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default CardLanding