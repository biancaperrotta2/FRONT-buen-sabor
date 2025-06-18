import React from 'react'

type StatusDotProps = {
  available: boolean
}

export const StatusDot: React.FC<StatusDotProps> = ({ available }) => {
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${
        available ? 'bg-green-500' : 'bg-red-500'
      }`}
      title={available ? 'Disponible' : 'No disponible'}
    ></span>
  )
}
