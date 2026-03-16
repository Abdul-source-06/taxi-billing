import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export function useRegistros(fecha = new Date()) {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const fechaStr = format(fecha, 'yyyy-MM-dd')

  useEffect(() => {
    cargarRegistros()
  }, [fechaStr])

  async function cargarRegistros() {
    setLoading(true)
    const { data } = await supabase
      .from('registros')
      .select('*')
      .eq('fecha', fechaStr)
      .order('hora', { ascending: false })
    setRegistros(data || [])
    setLoading(false)
  }

  async function añadirRegistro(importe, tipo, notas = '') {
    const ahora = new Date()
    const { data } = await supabase
      .from('registros')
      .insert([{
        fecha: fechaStr,
        hora: format(ahora, 'HH:mm:ss'),
        importe: parseFloat(importe),
        tipo,
        notas
      }])
      .select()
    if (data) setRegistros(prev => [data[0], ...prev])
  }

  async function eliminarRegistro(id) {
    await supabase.from('registros').delete().eq('id', id)
    setRegistros(prev => prev.filter(r => r.id !== id))
  }

  const total = registros.reduce((acc, r) => acc + parseFloat(r.importe), 0)

  return { registros, loading, total, añadirRegistro, eliminarRegistro, cargarRegistros }
}