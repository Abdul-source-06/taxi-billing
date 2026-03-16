import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import {
  getRegistrosLocal, guardarRegistroLocal, eliminarRegistroLocal,
  getGastosLocal, guardarGastoLocal, eliminarGastoLocal,
  añadirPendiente
} from '../lib/db'
import { sincronizar } from '../lib/sync'

export function useRegistros(fecha = new Date()) {
  const [registros, setRegistros] = useState([])
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)
  const fechaStr = format(fecha, 'yyyy-MM-dd')

  useEffect(() => {
    function handleOnline() {
      setOnline(true)
      sincronizar().then(() => cargarTodo())
    }
    function handleOffline() {
      setOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    cargarTodo()
  }, [fechaStr])

  async function cargarTodo() {
    setLoading(true)
    if (navigator.onLine) {
      try {
        const [{ data: dataRegistros }, { data: dataGastos }] = await Promise.all([
          supabase.from('registros').select('*').eq('fecha', fechaStr).order('hora', { ascending: false }),
          supabase.from('gastos').select('*').eq('fecha', fechaStr).order('hora', { ascending: false })
        ])
        const regs = dataRegistros || []
        const gasts = dataGastos || []
        // Guarda en local para uso offline
        await Promise.all(regs.map(r => guardarRegistroLocal(r)))
        await Promise.all(gasts.map(g => guardarGastoLocal(g)))
        setRegistros(regs)
        setGastos(gasts)
      } catch {
        // Si falla, carga desde local
        const regs = await getRegistrosLocal(fechaStr)
        const gasts = await getGastosLocal(fechaStr)
        setRegistros(regs)
        setGastos(gasts)
      }
    } else {
      // Sin internet, carga desde local
      const regs = await getRegistrosLocal(fechaStr)
      const gasts = await getGastosLocal(fechaStr)
      setRegistros(regs.sort((a, b) => b.hora.localeCompare(a.hora)))
      setGastos(gasts.sort((a, b) => b.hora.localeCompare(a.hora)))
    }

    // Notificación de objetivo
    const objetivo = localStorage.getItem('objetivoDiario')
    const notifActivadas = localStorage.getItem('notificaciones') === 'true'
    if (objetivo && notifActivadas && Notification.permission === 'granted') {
      const totalActual = registros.reduce((acc, r) => acc + parseFloat(r.importe), 0)
      const yaNotificado = sessionStorage.getItem(`objetivo_${fechaStr}`)
      if (totalActual >= parseFloat(objetivo) && !yaNotificado) {
        new Notification('🚕 TaxiLog — ¡Objetivo alcanzado!', {
          body: `Has facturado ${totalActual.toFixed(2)} € hoy. ¡Enhorabuena!`,
        })
        sessionStorage.setItem(`objetivo_${fechaStr}`, 'true')
      }
    }

    setLoading(false)
  }

  async function añadirRegistro(importe, tipo, notas = '') {
    const ahora = new Date()
    const nuevoRegistro = {
      id: crypto.randomUUID(),
      fecha: fechaStr,
      hora: format(ahora, 'HH:mm:ss'),
      importe: parseFloat(importe),
      tipo,
      notas,
      created_at: new Date().toISOString()
    }

    // Guarda localmente primero
    await guardarRegistroLocal(nuevoRegistro)
    setRegistros(prev => [nuevoRegistro, ...prev])

    if (navigator.onLine) {
      const { data } = await supabase.from('registros').insert([nuevoRegistro]).select()
      if (data) {
        await guardarRegistroLocal(data[0])
        setRegistros(prev => prev.map(r => r.id === nuevoRegistro.id ? data[0] : r))
      }
    } else {
      await añadirPendiente({ tipo: 'insertar_registro', datos: nuevoRegistro })
    }
  }

  async function editarRegistro(id, importe, tipo, notas) {
    const registroActualizado = { ...registros.find(r => r.id === id), importe: parseFloat(importe), tipo, notas }
    await guardarRegistroLocal(registroActualizado)
    setRegistros(prev => prev.map(r => r.id === id ? registroActualizado : r))

    if (navigator.onLine) {
      await supabase.from('registros').update({ importe: parseFloat(importe), tipo, notas }).eq('id', id)
    } else {
      await añadirPendiente({ tipo: 'editar_registro', datos: { id, importe, tipo, notas } })
    }
  }

  async function eliminarRegistro(id) {
    await eliminarRegistroLocal(id)
    setRegistros(prev => prev.filter(r => r.id !== id))

    if (navigator.onLine) {
      await supabase.from('registros').delete().eq('id', id)
    } else {
      await añadirPendiente({ tipo: 'eliminar_registro', datos: { id } })
    }
  }

  async function añadirGasto(importe, concepto) {
    const ahora = new Date()
    const nuevoGasto = {
      id: crypto.randomUUID(),
      fecha: fechaStr,
      hora: format(ahora, 'HH:mm:ss'),
      importe: parseFloat(importe),
      concepto,
      created_at: new Date().toISOString()
    }

    await guardarGastoLocal(nuevoGasto)
    setGastos(prev => [nuevoGasto, ...prev])

    if (navigator.onLine) {
      const { data } = await supabase.from('gastos').insert([nuevoGasto]).select()
      if (data) {
        await guardarGastoLocal(data[0])
        setGastos(prev => prev.map(g => g.id === nuevoGasto.id ? data[0] : g))
      }
    } else {
      await añadirPendiente({ tipo: 'insertar_gasto', datos: nuevoGasto })
    }
  }

  async function eliminarGasto(id) {
    await eliminarGastoLocal(id)
    setGastos(prev => prev.filter(g => g.id !== id))

    if (navigator.onLine) {
      await supabase.from('gastos').delete().eq('id', id)
    } else {
      await añadirPendiente({ tipo: 'eliminar_gasto', datos: { id } })
    }
  }

  const totalIngresos = registros.reduce((acc, r) => acc + parseFloat(r.importe), 0)
  const totalGastos = gastos.reduce((acc, g) => acc + parseFloat(g.importe), 0)
  const beneficioNeto = totalIngresos - totalGastos

  return {
    registros, gastos, loading, online,
    total: totalIngresos, totalGastos, beneficioNeto,
    añadirRegistro, editarRegistro, eliminarRegistro,
    añadirGasto, eliminarGasto
  }
}