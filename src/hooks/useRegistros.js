import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export function useRegistros(fecha = new Date()) {
  const [registros, setRegistros] = useState([])
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const fechaStr = format(fecha, 'yyyy-MM-dd')

  useEffect(() => {
    cargarTodo()
  }, [fechaStr])

  async function cargarTodo() {
    setLoading(true)
    const [{ data: dataRegistros }, { data: dataGastos }] = await Promise.all([
      supabase.from('registros').select('*').eq('fecha', fechaStr).order('hora', { ascending: false }),
      supabase.from('gastos').select('*').eq('fecha', fechaStr).order('hora', { ascending: false })
    ])
    setRegistros(dataRegistros || [])
    setGastos(dataGastos || [])
    setLoading(false)
    const objetivo = localStorage.getItem('objetivoDiario')
const notifActivadas = localStorage.getItem('notificaciones') === 'true'
if (objetivo && notifActivadas && Notification.permission === 'granted') {
  const totalActual = (dataRegistros || []).reduce((acc, r) => acc + parseFloat(r.importe), 0)
  const yaNotificado = sessionStorage.getItem(`objetivo_${fechaStr}`)
  if (totalActual >= parseFloat(objetivo) && !yaNotificado) {
    new Notification('🚕 TaxiLog — ¡Objetivo alcanzado!', {
      body: `Has facturado ${totalActual.toFixed(2)} € hoy. ¡Enhorabuena!`,
    })
    sessionStorage.setItem(`objetivo_${fechaStr}`, 'true')
  }
}
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

  async function editarRegistro(id, importe, tipo, notas) {
    const { data } = await supabase
      .from('registros')
      .update({ importe: parseFloat(importe), tipo, notas })
      .eq('id', id)
      .select()
    if (data) setRegistros(prev => prev.map(r => r.id === id ? data[0] : r))
  }

  async function eliminarRegistro(id) {
    await supabase.from('registros').delete().eq('id', id)
    setRegistros(prev => prev.filter(r => r.id !== id))
  }

  async function añadirGasto(importe, concepto) {
    const ahora = new Date()
    const { data } = await supabase
      .from('gastos')
      .insert([{
        fecha: fechaStr,
        hora: format(ahora, 'HH:mm:ss'),
        importe: parseFloat(importe),
        concepto
      }])
      .select()
    if (data) setGastos(prev => [data[0], ...prev])
  }

  async function eliminarGasto(id) {
    await supabase.from('gastos').delete().eq('id', id)
    setGastos(prev => prev.filter(g => g.id !== id))
  }

  const totalIngresos = registros.reduce((acc, r) => acc + parseFloat(r.importe), 0)
  const totalGastos = gastos.reduce((acc, g) => acc + parseFloat(g.importe), 0)
  const beneficioNeto = totalIngresos - totalGastos

  return {
    registros, gastos, loading,
    total: totalIngresos, totalGastos, beneficioNeto,
    añadirRegistro, editarRegistro, eliminarRegistro,
    añadirGasto, eliminarGasto
  }
}