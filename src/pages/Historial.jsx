import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronRight, ChevronLeft, Calendar, Check, X, Car, Plane, MapPin } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useSwipeable } from 'react-swipeable'

const ORIGENES = [
  { id: 'taximetro', label: 'Taxímetro', emoji: '🚕', logo: null, bg: '#fde68a', color: '#78350f', bgModal: '#facc15', colorModal: '#78350f' },
  { id: 'freenow', label: 'FreeNow', emoji: null, logo: '/freenow.png', bg: '#fecdd3', color: '#be123c', bgModal: '#ef4444', colorModal: '#ffffff' },
  { id: 'uber', label: 'Uber', emoji: null, logo: '/uber.png', bg: '#9da4b1', color: '#1f2937', bgModal: '#374151', colorModal: '#ffffff' },
]

const TIPOS = [
  { id: 'servicio', label: 'Servicio', icon: Car },
  { id: 'aeropuerto', label: 'Aeropuerto', icon: Plane },
  { id: 'largo', label: 'Largo recorrido', icon: MapPin },
]

function OrigenIcon({ origen, className = "h-4" }) {
  return origen.logo
    ? <img src={origen.logo} alt={origen.label} className={`${className} object-contain`} />
    : <span>{origen.emoji}</span>
}

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
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 rounded-2xl">
        <button onClick={() => onBorrar(dia.fecha)}
          className="text-white font-bold text-sm flex flex-col items-center gap-1">
          <span className="text-2xl">🗑️</span>
          Eliminar
        </button>
      </div>

      <div {...handlers}
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow transition-transform duration-300"
        style={{ transform: deslizado ? 'translateX(-80px)' : 'translateX(0)' }}>

        <button onClick={() => onExpandir(dia.fecha)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-yellow-50 dark:hover:bg-gray-700 transition">
          <div className="text-left">
            <p className="font-bold text-gray-800 dark:text-gray-100 capitalize">
              {format(new Date(dia.fecha + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <div className="flex gap-2 mt-0.5 flex-wrap items-center">
              <span className="text-xs text-gray-400">{dia.servicios} servicios</span>
              {dia.taximetro > 0 && <span className="text-xs text-gray-400">🚕 {dia.taximetro.toFixed(2)}€</span>}
              {dia.freenow > 0 && <span className="text-xs text-gray-400 flex items-center gap-0.5"><img src="/freenow.png" className="h-3 object-contain" alt="FreeNow" /> {dia.freenow.toFixed(2)}€</span>}
              {dia.uber > 0 && <span className="text-xs text-gray-400 flex items-center gap-0.5"><img src="/uber.png" className="h-3 object-contain" alt="Uber" /> {dia.uber.toFixed(2)}€</span>}
              {dia.efectivo > 0 && <span className="text-xs text-green-500">💵 {dia.efectivo.toFixed(2)}€</span>}
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
  const [efectivoDia, setEfectivoDia] = useState(0)
  const [loadingDia, setLoadingDia] = useState(false)
  const [editandoRegistro, setEditandoRegistro] = useState(null)
  const [editImporte, setEditImporte] = useState('')
  const [editTipo, setEditTipo] = useState('servicio')
  const [editOrigen, setEditOrigen] = useState('taximetro')
  const [editNotas, setEditNotas] = useState('')
  const [añadiendoEfectivo, setAñadiendoEfectivo] = useState(false)
  const [nuevoEfectivo, setNuevoEfectivo] = useState('')
  const [guardandoEfectivo, setGuardandoEfectivo] = useState(false)
  const [editandoEfectivo, setEditandoEfectivo] = useState(false)
  const [editEfectivoImporte, setEditEfectivoImporte] = useState('')
  const [modalOrigen, setModalOrigen] = useState(null)
  const [modalOrigenValor, setModalOrigenValor] = useState('')
  const [modalOrigenOperacion, setModalOrigenOperacion] = useState('sumar')
  const [guardandoOrigen, setGuardandoOrigen] = useState(false)
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

    const [{ data }, { data: dataEfectivo }] = await Promise.all([
      supabase.from('registros').select('fecha, importe, origen').gte('fecha', inicio).lte('fecha', fin).order('fecha', { ascending: false }),
      supabase.from('efectivo_dia').select('fecha, importe').gte('fecha', inicio).lte('fecha', fin)
    ])

    if (data) {
      const agrupado = data.reduce((acc, r) => {
        if (!acc[r.fecha]) acc[r.fecha] = { fecha: r.fecha, total: 0, servicios: 0, taximetro: 0, freenow: 0, uber: 0, efectivo: 0 }
        acc[r.fecha].total += parseFloat(r.importe)
        acc[r.fecha].servicios += 1
        if (r.origen === 'freenow') acc[r.fecha].freenow += parseFloat(r.importe)
        else if (r.origen === 'uber') acc[r.fecha].uber += parseFloat(r.importe)
        else acc[r.fecha].taximetro += parseFloat(r.importe)
        return acc
      }, {})

      if (dataEfectivo) {
        dataEfectivo.forEach(e => {
          if (agrupado[e.fecha]) agrupado[e.fecha].efectivo = parseFloat(e.importe)
        })
      }

      setDias(Object.values(agrupado).sort((a, b) => b.fecha.localeCompare(a.fecha)))
    }
    setLoading(false)
  }

  async function expandirDia(fecha) {
    if (diaExpandido === fecha) {
      setDiaExpandido(null)
      setEditandoRegistro(null)
      setEfectivoDia(0)
      return
    }
    setDiaExpandido(fecha)
    setEditandoRegistro(null)
    setAñadiendoEfectivo(false)
    setLoadingDia(true)

    const [{ data }, { data: dataEfectivo }] = await Promise.all([
      supabase.from('registros').select('*').eq('fecha', fecha).order('hora', { ascending: false }),
      supabase.from('efectivo_dia').select('*').eq('fecha', fecha).limit(1)
    ])

    setRegistrosDia(data || [])
    setEfectivoDia(dataEfectivo?.[0]?.importe || 0)
    setLoadingDia(false)
  }

  async function guardarEfectivoDia(fecha) {
    if (!nuevoEfectivo || isNaN(nuevoEfectivo)) return
    setGuardandoEfectivo(true)
    const nuevoTotal = efectivoDia + parseFloat(nuevoEfectivo)
    await supabase.from('efectivo_dia').upsert({ fecha, importe: nuevoTotal }, { onConflict: 'fecha' })
    setEfectivoDia(nuevoTotal)
    await cargarHistorial()
    toast.success(`Efectivo guardado — Total: ${nuevoTotal.toFixed(2)} €`)
    setNuevoEfectivo('')
    setAñadiendoEfectivo(false)
    setGuardandoEfectivo(false)
  }

  async function editarEfectivoDia(fecha, importe) {
    await supabase.from('efectivo_dia').upsert({ fecha, importe: parseFloat(importe) }, { onConflict: 'fecha' })
    setEfectivoDia(parseFloat(importe))
    await cargarHistorial()
    toast.success('Efectivo actualizado')
  }

  async function guardarModalOrigen() {
    if (!modalOrigenValor || isNaN(modalOrigenValor)) return
    setGuardandoOrigen(true)

    const { fecha, origenId, importe } = modalOrigen
    const valor = parseFloat(modalOrigenValor)
    const nuevoTotal = modalOrigenOperacion === 'sumar'
      ? importe + valor
      : Math.max(0, importe - valor)

    const registroExistente = registrosDia.find(r => r.origen === origenId)

    if (registroExistente) {
      await supabase.from('registros').update({ importe: nuevoTotal }).eq('id', registroExistente.id)
      setRegistrosDia(prev => prev.map(r => r.id === registroExistente.id ? { ...r, importe: nuevoTotal } : r))
    } else if (modalOrigenOperacion === 'sumar') {
      const { data } = await supabase.from('registros').insert([{
        id: crypto.randomUUID(),
        fecha,
        hora: format(new Date(), 'HH:mm:ss'),
        importe: nuevoTotal,
        tipo: 'servicio',
        origen: origenId,
        notas: '',
      }]).select()
      if (data) setRegistrosDia(prev => [data[0], ...prev])
    }

    await cargarHistorial()
    const origenLabel = ORIGENES.find(o => o.id === origenId)?.label
    toast.success(`${origenLabel} actualizado — Total: ${nuevoTotal.toFixed(2)} €`)
    setModalOrigenValor('')
    setModalOrigen(null)
    setGuardandoOrigen(false)
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

      {/* Modal editar servicio */}
      {editandoRegistro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl p-5 w-full max-w-lg space-y-3 shadow-2xl" style={estiloModal}>
            <h3 className="font-bold text-lg" style={{ color: '#111827' }}>Editar servicio</h3>
            <div className="flex gap-1">
              {ORIGENES.map(o => (
                <button key={o.id} type="button" onClick={() => setEditOrigen(o.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                  style={editOrigen === o.id ? { backgroundColor: o.bgModal, color: o.colorModal } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                  <OrigenIcon origen={o} className="h-3" />
                  {o.label}
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

      {/* Modal origen (sumar/restar) */}
      {modalOrigen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl p-5 w-full max-w-lg space-y-3 shadow-2xl" style={estiloModal}>
            {(() => {
              const origen = ORIGENES.find(o => o.id === modalOrigen.origenId)
              return (
                <>
                  <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: '#111827' }}>
                    <OrigenIcon origen={origen} className="h-5" />
                    {origen.label}
                  </h3>
                  {modalOrigen.importe > 0 && (
                    <div className="rounded-xl px-4 py-2 flex items-center justify-between" style={{ backgroundColor: origen.bg }}>
                      <span className="text-sm font-semibold" style={{ color: origen.color }}>Total actual</span>
                      <span className="font-black text-lg" style={{ color: origen.color }}>{modalOrigen.importe.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setModalOrigenOperacion('sumar')}
                      className="flex-1 py-2 rounded-xl font-bold text-sm transition"
                      style={modalOrigenOperacion === 'sumar' ? { backgroundColor: origen.bgModal, color: origen.colorModal } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                      + Sumar
                    </button>
                    <button onClick={() => setModalOrigenOperacion('restar')}
                      className="flex-1 py-2 rounded-xl font-bold text-sm transition"
                      style={modalOrigenOperacion === 'restar' ? { backgroundColor: '#ef4444', color: '#ffffff' } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                      − Restar
                    </button>
                  </div>
                  <div className="flex gap-2 items-center pb-1" style={{ borderBottom: `2px solid ${origen.bgModal}` }}>
                    <span className="font-bold text-xl" style={{ color: '#9ca3af' }}>€</span>
                    <input type="number" step="0.01" placeholder="0.00" value={modalOrigenValor}
                      onChange={e => setModalOrigenValor(e.target.value)}
                      className="flex-1 font-bold text-2xl outline-none"
                      style={{ backgroundColor: 'transparent', color: '#111827' }} />
                  </div>
                  {modalOrigenValor && !isNaN(modalOrigenValor) && (
                    <div className="rounded-xl px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#f9fafb' }}>
                      <span className="text-sm text-gray-500">Nuevo total</span>
                      <span className="font-black text-lg" style={{ color: origen.color }}>
                        {(modalOrigenOperacion === 'sumar'
                          ? modalOrigen.importe + parseFloat(modalOrigenValor)
                          : Math.max(0, modalOrigen.importe - parseFloat(modalOrigenValor))
                        ).toFixed(2)} €
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={guardarModalOrigen}
                      disabled={guardandoOrigen || !modalOrigenValor}
                      className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: origen.bgModal, color: origen.colorModal }}>
                      <Check size={18} /> {guardandoOrigen ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button onClick={() => { setModalOrigen(null); setModalOrigenValor('') }}
                      className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                      style={estiloBotonGris}>
                      <X size={18} /> Cancelar
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal añadir efectivo */}
      {añadiendoEfectivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl p-5 w-full max-w-lg space-y-3 shadow-2xl" style={estiloModal}>
            <h3 className="font-bold text-lg" style={{ color: '#111827' }}>💵 Añadir efectivo</h3>
            {efectivoDia > 0 && (
              <div className="rounded-xl px-4 py-2 flex items-center justify-between" style={{ backgroundColor: '#f0fdf4' }}>
                <span className="text-sm font-semibold" style={{ color: '#15803d' }}>Total acumulado</span>
                <span className="font-black text-lg" style={{ color: '#15803d' }}>{efectivoDia.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex gap-2 items-center pb-1" style={{ borderBottom: '2px solid #22c55e' }}>
              <span className="font-bold text-xl" style={{ color: '#9ca3af' }}>€</span>
              <input type="number" step="0.01" placeholder="0.00" value={nuevoEfectivo}
                onChange={e => setNuevoEfectivo(e.target.value)}
                className="flex-1 font-bold text-2xl outline-none"
                style={{ backgroundColor: 'transparent', color: '#111827' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => guardarEfectivoDia(añadiendoEfectivo)}
                disabled={guardandoEfectivo || !nuevoEfectivo}
                className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#22c55e', color: '#ffffff' }}>
                <Check size={18} /> {guardandoEfectivo ? 'Guardando...' : 'Añadir'}
              </button>
              <button onClick={() => { setAñadiendoEfectivo(false); setNuevoEfectivo('') }}
                className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                style={estiloBotonGris}>
                <X size={18} /> Cancelar
              </button>
            </div>
            {efectivoDia > 0 && (
              <button
                onClick={() => {
                  setEditEfectivoImporte(efectivoDia.toString())
                  setEditandoEfectivo(añadiendoEfectivo)
                  setAñadiendoEfectivo(false)
                }}
                className="w-full font-bold py-2 rounded-xl text-sm"
                style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>
                Editar total
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal editar efectivo */}
      {editandoEfectivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-2xl p-5 w-full max-w-lg space-y-3 shadow-2xl" style={estiloModal}>
            <h3 className="font-bold text-lg" style={{ color: '#111827' }}>✏️ Editar efectivo</h3>
            <div className="flex gap-2 items-center pb-1" style={{ borderBottom: '2px solid #22c55e' }}>
              <span className="font-bold text-xl" style={{ color: '#9ca3af' }}>€</span>
              <input type="number" step="0.01" value={editEfectivoImporte}
                onChange={e => setEditEfectivoImporte(e.target.value)}
                className="flex-1 font-bold text-2xl outline-none"
                style={{ backgroundColor: 'transparent', color: '#111827' }} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!editEfectivoImporte || isNaN(editEfectivoImporte)) return
                  await editarEfectivoDia(editandoEfectivo, editEfectivoImporte)
                  setEditandoEfectivo(false)
                  setEditEfectivoImporte('')
                }}
                className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                style={{ backgroundColor: '#22c55e', color: '#ffffff' }}>
                <Check size={18} /> Guardar
              </button>
              <button onClick={() => { setEditandoEfectivo(false); setEditEfectivoImporte('') }}
                className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                style={estiloBotonGris}>
                <X size={18} /> Cancelar
              </button>
            </div>
            <button
              onClick={async () => {
                await supabase.from('efectivo_dia').delete().eq('fecha', editandoEfectivo)
                setEfectivoDia(0)
                await cargarHistorial()
                toast.success('Efectivo eliminado')
                setEditandoEfectivo(false)
              }}
              className="w-full font-bold py-2 rounded-xl text-sm"
              style={estiloBotonRojo}>
              Eliminar efectivo
            </button>
          </div>
        </div>
      )}

      {/* Lista de días */}
      <div className="space-y-2">
        {dias.map(dia => (
          <FilaDia key={dia.fecha} dia={dia} porcentaje={porcentaje}
            diaExpandido={diaExpandido} onExpandir={expandirDia} onBorrar={borrarDia}>
            {diaExpandido === dia.fecha && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {loadingDia ? (
                  <p className="text-center text-gray-400 py-4 text-sm">Cargando...</p>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {ORIGENES.map(origen => {
                      const registro = registrosDia.find(r => r.origen === origen.id)
                      const importe = registro ? parseFloat(registro.importe) : 0
                      return (
                        <div key={origen.id} className="px-4 py-3 flex items-center justify-between"
                          style={{ backgroundColor: origen.bg }}>
                          <div>
                            <div className="flex items-center gap-2">
                              <OrigenIcon origen={origen} className="h-4" />
                              <span className="font-black" style={{ color: origen.color }}>
                                {importe > 0 ? `${importe.toFixed(2)} €` : 'Sin registros'}
                              </span>
                            </div>
                            <p className="text-xs" style={{ color: origen.color, opacity: 0.7 }}>{origen.label}</p>
                          </div>
                          <button
                            onClick={() => {
                              setModalOrigen({ fecha: dia.fecha, origenId: origen.id, importe })
                              setModalOrigenOperacion('sumar')
                              setModalOrigenValor('')
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl"
                            style={{ backgroundColor: origen.bgModal, color: origen.colorModal }}>
                            {importe > 0 ? '+ Añadir' : 'Añadir'}
                          </button>
                        </div>
                      )
                    })}

                    <div className="px-4 py-3 flex items-center justify-between bg-green-50 dark:bg-green-900">
                      <div>
                        <span className="font-black text-green-700 dark:text-green-300">
                          💵 {efectivoDia > 0 ? `${efectivoDia.toFixed(2)} €` : 'Sin efectivo'}
                        </span>
                        <p className="text-xs text-green-600 dark:text-green-400">Efectivo</p>
                      </div>
                      <button onClick={() => setAñadiendoEfectivo(dia.fecha)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl"
                        style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                        {efectivoDia > 0 ? '+ Añadir' : 'Añadir'}
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