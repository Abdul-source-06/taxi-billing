import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronRight, ChevronLeft, Calendar, Check, X, Car, Plane, MapPin } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useSwipeable } from 'react-swipeable'

const ORIGENES = [
  { id: 'taximetro', label: 'Taxímetro', emoji: '🚕' },
  { id: 'freenow', label: 'FreeNow', emoji: '🔴' },
  { id: 'uber', label: 'Uber', emoji: '⚫' },
]

const TIPOS = [
  { id: 'servicio', label: 'Servicio', icon: Car },
  { id: 'aeropuerto', label: 'Aeropuerto', icon: Plane },
  { id: 'largo', label: 'Largo recorrido', icon: MapPin },
]

function FilaDia({ dia, porcentaje, diaExpandido, onExpandir, onBorrar, children }) {
  const [deslizado, setDeslizado] = useState(false)

  const handlers = useSwipeable({
    onSwipedLeft: () => setDeslizado(true),
    onSwipedRight: () => setDeslizado(false),
    trackMouse: false,
    delta: 50,
  })

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Fondo rojo de borrar */}
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 rounded-2xl">
        <button onClick={() => onBorrar(dia.fecha)}
          className="text-white font-bold text-sm flex flex-col items-center gap-1">
          <span className="text-2xl">🗑️</span>
          Eliminar
        </button>
      </div>

      {/* Contenido deslizable */}
      <div {...handlers}
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow transition-transform duration-300"
        style={{ transform: deslizado ? 'translateX(-80px)' : 'translateX(0)' }}>

        <button onClick={() => onExpandir(dia.fecha)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-yellow-50 dark:hover:bg-gray-700 transition">
          <div className="text-left">
            <p className="font-bold text-gray-800 dark:text-gray-100 capitalize">
              {format(new Date(dia.fecha + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <div className="flex gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-400">{dia.servicios} servicios</span>
              {dia.taximetro > 0 && <span className="text-xs text-gray-400">🚕 {dia.taximetro.toFixed(2)}€</span>}
              {dia.freenow > 0 && <span className="text-xs text-gray-400">🔴 {dia.freenow.toFixed(2)}€</span>}
              {dia.uber > 0 && <span className="text-xs text-gray-400">⚫ {dia.uber.toFixed(2)}€</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="font-black text-yellow-500 text-lg">{dia.total.toFixed(2)} €</p>
              <p className="text-xs text-gray-400">tu parte: <span className="font-bold text-yellow-400">{(dia.total * porcentaje / 100).toFixed(2)}€</span></p>
            </div>
            <ChevronRight size={18} className={`text-gray-300 transition-transform duration-200 ${diaExpandido === dia.fecha ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {children}
      </div>
    </div>
  )
}

export default function Historial() {
  const [dias, setDias] = useState([])
  const [loading, setLoading] = useState(true)
  const [fechaRef, setFechaRef] = useState(new Date())
  const [diaExpandido, setDiaExpandido] = useState(null)
  const [registrosDia, setRegistrosDia] = useState([])
  const [loadingDia, setLoadingDia] = useState(false)
  const [editandoRegistro, setEditandoRegistro] = useState(null)
  const [editImporte, setEditImporte] = useState('')
  const [editTipo, setEditTipo] = useState('servicio')
  const [editOrigen, setEditOrigen] = useState('taximetro')
  const [editNotas, setEditNotas] = useState('')
  const [añadiendoEnDia, setAñadiendoEnDia] = useState(null)
  const [nuevoImporte, setNuevoImporte] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState('servicio')
  const [nuevoOrigen, setNuevoOrigen] = useState('taximetro')
  const [nuevoNotas, setNuevoNotas] = useState('')
  const [guardandoNuevo, setGuardandoNuevo] = useState(false)
  const porcentaje = parseFloat(localStorage.getItem('porcentaje') || '45')

  useEffect(() => {
    cargarHistorial()
    setDiaExpandido(null)
    setEditandoRegistro(null)
  }, [fechaRef])

  async function cargarHistorial() {
    setLoading(true)
    const inicio = format(startOfMonth(fechaRef), 'yyyy-MM-dd')
    const fin = format(endOfMonth(fechaRef), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('registros')
      .select('fecha, importe, origen')
      .gte('fecha', inicio)
      .lte('fecha', fin)
      .order('fecha', { ascending: false })

    if (data) {
      const agrupado = data.reduce((acc, r) => {
        if (!acc[r.fecha]) acc[r.fecha] = { fecha: r.fecha, total: 0, servicios: 0, taximetro: 0, freenow: 0, uber: 0 }
        acc[r.fecha].total += parseFloat(r.importe)
        acc[r.fecha].servicios += 1
        if (r.origen === 'freenow') acc[r.fecha].freenow += parseFloat(r.importe)
        else if (r.origen === 'uber') acc[r.fecha].uber += parseFloat(r.importe)
        else acc[r.fecha].taximetro += parseFloat(r.importe)
        return acc
      }, {})
      setDias(Object.values(agrupado).sort((a, b) => b.fecha.localeCompare(a.fecha)))
    }
    setLoading(false)
  }

  async function expandirDia(fecha) {
    if (diaExpandido === fecha) {
      setDiaExpandido(null)
      setEditandoRegistro(null)
      return
    }
    setDiaExpandido(fecha)
    setEditandoRegistro(null)
    setLoadingDia(true)
    const { data } = await supabase
      .from('registros')
      .select('*')
      .eq('fecha', fecha)
      .order('hora', { ascending: false })
    setRegistrosDia(data || [])
    setLoadingDia(false)
  }

  function iniciarEdicion(r) {
    setEditandoRegistro(r.id)
    setEditImporte(r.importe)
    setEditTipo(r.tipo)
    setEditOrigen(r.origen || 'taximetro')
    setEditNotas(r.notas || '')
  }

  async function guardarEdicion(id) {
    await supabase.from('registros').update({
      importe: parseFloat(editImporte),
      tipo: editTipo,
      origen: editOrigen,
      notas: editNotas
    }).eq('id', id)
    setRegistrosDia(prev => prev.map(r => r.id === id
      ? { ...r, importe: parseFloat(editImporte), tipo: editTipo, origen: editOrigen, notas: editNotas }
      : r
    ))
    await cargarHistorial()
    toast.success('Registro actualizado')
    setEditandoRegistro(null)
  }

  async function eliminarRegistro(id) {
    await supabase.from('registros').delete().eq('id', id)
    setRegistrosDia(prev => prev.filter(r => r.id !== id))
    await cargarHistorial()
    toast.success('Eliminado')
    setEditandoRegistro(null)
  }

  async function borrarDia(fecha) {
    if (!confirm(`¿Eliminar todos los registros del ${format(new Date(fecha + 'T00:00:00'), "d 'de' MMMM", { locale: es })}?`)) return
    await supabase.from('registros').delete().eq('fecha', fecha)
    await supabase.from('efectivo_dia').delete().eq('fecha', fecha)
    await cargarHistorial()
    if (diaExpandido === fecha) setDiaExpandido(null)
    toast.success('Día eliminado')
  }

  async function añadirServicioDia(fecha) {
    if (!nuevoImporte || isNaN(nuevoImporte)) return
    setGuardandoNuevo(true)

    const existente = registrosDia.find(r => r.origen === nuevoOrigen)

    if (existente) {
      const nuevoTotal = parseFloat(existente.importe) + parseFloat(nuevoImporte)
      await supabase.from('registros').update({ importe: nuevoTotal }).eq('id', existente.id)
      setRegistrosDia(prev => prev.map(r => r.id === existente.id
        ? { ...r, importe: nuevoTotal }
        : r
      ))
      toast.success(`Sumado a ${ORIGENES.find(o => o.id === nuevoOrigen)?.label}`)
    } else {
      const { data } = await supabase.from('registros').insert([{
        id: crypto.randomUUID(),
        fecha,
        hora: format(new Date(), 'HH:mm:ss'),
        importe: parseFloat(nuevoImporte),
        tipo: nuevoTipo,
        origen: nuevoOrigen,
        notas: nuevoNotas,
      }]).select()
      if (data) setRegistrosDia(prev => [data[0], ...prev])
      toast.success('Servicio añadido')
    }

    await cargarHistorial()
    setNuevoImporte('')
    setNuevoNotas('')
    setNuevoOrigen('taximetro')
    setNuevoTipo('servicio')
    setAñadiendoEnDia(null)
    setGuardandoNuevo(false)
  }

  const esActual = format(fechaRef, 'yyyy-MM') === format(new Date(), 'yyyy-MM')
  const labelMes = format(fechaRef, 'MMMM yyyy', { locale: es })
  const estiloModal = { backgroundColor: '#ffffff', color: '#111827' }
  const estiloBotonGris = { backgroundColor: '#f3f4f6', color: '#6b7280' }
  const estiloBotonRojo = { backgroundColor: '#fef2f2', color: '#ef4444' }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Toaster />

      {/* Selector de mes */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setFechaRef(subMonths(fechaRef, 1))}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow text-gray-500 hover:text-yellow-500">
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-gray-700 dark:text-gray-200 capitalize">{labelMes}</span>
        <button onClick={() => setFechaRef(addMonths(fechaRef, 1))} disabled={esActual}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow text-gray-500 hover:text-yellow-500 disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 mt-8">Cargando...</p>}

      {/* Modal editar */}
      {editandoRegistro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl p-5 w-full max-w-lg space-y-3 shadow-2xl" style={estiloModal}>
            <h3 className="font-bold text-lg" style={{ color: '#111827' }}>Editar servicio</h3>
            <div className="flex gap-1">
              {ORIGENES.map(o => (
                <button key={o.id} type="button" onClick={() => setEditOrigen(o.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition"
                  style={editOrigen === o.id ? { backgroundColor: '#facc15', color: '#78350f' } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center pb-1" style={{ borderBottom: '2px solid #facc15' }}>
              <span className="font-bold text-xl" style={{ color: '#9ca3af' }}>€</span>
              <input type="number" step="0.01" value={editImporte}
                onChange={e => setEditImporte(e.target.value)}
                className="flex-1 font-bold text-2xl outline-none"
                style={{ backgroundColor: 'transparent', color: '#111827' }} />
            </div>
            <div className="flex gap-1">
              {TIPOS.map(t => (
                <button key={t.id} type="button" onClick={() => setEditTipo(t.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition flex flex-col items-center gap-1"
                  style={editTipo === t.id ? { backgroundColor: '#facc15', color: '#78350f' } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>
            <input type="text" value={editNotas} onChange={e => setEditNotas(e.target.value)}
              placeholder="Notas (opcional)"
              className="w-full rounded-xl p-2 text-sm outline-none"
              style={{ border: '1px solid #e5e7eb', backgroundColor: 'transparent', color: '#111827' }} />
            <div className="flex gap-2">
              <button onClick={() => guardarEdicion(editandoRegistro)}
                className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                style={{ backgroundColor: '#facc15', color: '#78350f' }}>
                <Check size={18} /> Guardar
              </button>
              <button onClick={() => setEditandoRegistro(null)}
                className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                style={estiloBotonGris}>
                <X size={18} /> Cancelar
              </button>
            </div>
            <button onClick={() => eliminarRegistro(editandoRegistro)}
              className="w-full font-bold py-3 rounded-xl"
              style={estiloBotonRojo}>
              Eliminar servicio
            </button>
          </div>
        </div>
      )}

      {/* Modal añadir */}
      {añadiendoEnDia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl p-5 w-full max-w-lg space-y-3 shadow-2xl" style={estiloModal}>
            <h3 className="font-bold text-lg" style={{ color: '#111827' }}>
              Añadir servicio — {format(new Date(añadiendoEnDia + 'T00:00:00'), "d 'de' MMMM", { locale: es })}
            </h3>
            <div className="flex gap-1">
              {ORIGENES.map(o => (
                <button key={o.id} type="button" onClick={() => setNuevoOrigen(o.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition"
                  style={nuevoOrigen === o.id ? { backgroundColor: '#facc15', color: '#78350f' } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                  {o.emoji} {o.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center pb-1" style={{ borderBottom: '2px solid #facc15' }}>
              <span className="font-bold text-xl" style={{ color: '#9ca3af' }}>€</span>
              <input type="number" step="0.01" placeholder="0.00" value={nuevoImporte}
                onChange={e => setNuevoImporte(e.target.value)}
                className="flex-1 font-bold text-2xl outline-none"
                style={{ backgroundColor: 'transparent', color: '#111827' }} />
            </div>
            <div className="flex gap-1">
              {TIPOS.map(t => (
                <button key={t.id} type="button" onClick={() => setNuevoTipo(t.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition flex flex-col items-center gap-1"
                  style={nuevoTipo === t.id ? { backgroundColor: '#facc15', color: '#78350f' } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>
            <input type="text" value={nuevoNotas} onChange={e => setNuevoNotas(e.target.value)}
              placeholder="Notas (opcional)"
              className="w-full rounded-xl p-2 text-sm outline-none"
              style={{ border: '1px solid #e5e7eb', backgroundColor: 'transparent', color: '#111827' }} />
            <div className="flex gap-2">
              <button onClick={() => añadirServicioDia(añadiendoEnDia)}
                disabled={guardandoNuevo || !nuevoImporte}
                className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#facc15', color: '#78350f' }}>
                <Check size={18} /> {guardandoNuevo ? 'Guardando...' : 'Añadir'}
              </button>
              <button onClick={() => setAñadiendoEnDia(null)}
                className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                style={estiloBotonGris}>
                <X size={18} /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de días */}
      <div className="space-y-2">
        {dias.map(dia => (
          <FilaDia
            key={dia.fecha}
            dia={dia}
            porcentaje={porcentaje}
            diaExpandido={diaExpandido}
            onExpandir={expandirDia}
            onBorrar={borrarDia}
          >
            {diaExpandido === dia.fecha && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {loadingDia ? (
                  <p className="text-center text-gray-400 py-4 text-sm">Cargando...</p>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {registrosDia.map(r => (
                      <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-800 dark:text-white">{parseFloat(r.importe).toFixed(2)} €</span>
                            <span className="text-sm">{ORIGENES.find(o => o.id === r.origen)?.emoji || '🚕'}</span>
                          </div>
                          <div className="flex gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-400">{r.hora?.slice(0, 5)}</span>
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 rounded-full">{r.tipo}</span>
                            {r.notas && <span className="text-xs text-gray-400">{r.notas}</span>}
                          </div>
                        </div>
                        <button onClick={() => iniciarEdicion(r)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl transition"
                          style={{ backgroundColor: '#fefce8', color: '#ca8a04' }}>
                          Editar
                        </button>
                      </div>
                    ))}
                    {registrosDia.length === 0 && (
                      <p className="text-center text-gray-400 py-4 text-sm">No hay servicios</p>
                    )}
                    <div className="px-4 py-3">
                      <button onClick={() => setAñadiendoEnDia(dia.fecha)}
                        className="w-full py-2 rounded-xl text-xs font-bold transition"
                        style={{ backgroundColor: '#fefce8', color: '#ca8a04' }}>
                        + Añadir servicio a este día
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </FilaDia>
        ))}

        {!loading && dias.length === 0 && (
          <div className="text-center mt-8">
            <Calendar size={40} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400">No hay registros este mes</p>
          </div>
        )}
      </div>
    </div>
  )
}