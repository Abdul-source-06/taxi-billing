import { useState, useEffect } from 'react'

export function useModoOscuro() {
  const [oscuro, setOscuro] = useState(() => {
    return localStorage.getItem('modoOscuro') === 'true'
  })

  useEffect(() => {
    if (oscuro) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('modoOscuro', oscuro)
  }, [oscuro])

  return { oscuro, toggleOscuro: () => setOscuro(prev => !prev) }
}