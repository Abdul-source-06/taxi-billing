import { useState } from 'react'
import { useRegistros } from '../hooks/useRegistros'
import { PlusCircle, Car, Plane, MapPin, ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import toast, { Toaster } from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

const TIPOS = [
  { id: 'servicio', label: 'Servicio', icon: Car },
  { id: 'aeropuerto', label: 'Aeropuerto', icon: Plane },
  { id: 'largo', label: 'Largo recorrido', icon: MapPin },
]

const ORIGENES = [
  { id: 'taximetro', label: 'Taxímetro', emoji: '🚕' },
  { id: 'freenow', label: 'FreeNow', emoji: '🔴' },
  { id: 'uber', label: 'Uber', emoji: '⚫' },
]

const CONCEPTOS_GASTO = ['Gasolina', 'Parking', 'Peaje', 'Mantenimiento', 'Otros']

export default function Hoy() {
  const location = useLocation()

  const [fecha, setFecha] = useState(() => {
    if (location.state?.fecha) return new Date(location.state.fecha + 'T00:00:00')
    return new Date()
  })

  const {
    registros, gastos, loading, online,
    total, tuParte, porcentaje,
    totalTaximetro, totalFreeNow, totalUber,
    añadirRegistro, añadirGasto, guardarEfectivo
  } = useRegistros(fecha)

  const [pestana, setPestana] = useState('servicios')
  const [importe, setImporte] = useState('')
  const [tipo, setTipo] = useState('servicio')
  const [origen, setOrigen] = useState('taximetro')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [gastoImporte, setGastoImporte] = useState('')
  const [gastoConcepto, setGastoConcepto] = useState('Gasolina')
  const [guardandoGasto, setGuardandoGasto] = useState(false)

  const [efectivoInput, setEfectivoInput] = useState('')
  const [guardandoEfectivo, setGuardandoEfectivo] = useState(false)

  const esHoy = isToday(fecha)
  const fechaLabel = esHoy ? 'Hoy' : format(fecha, "EEEE d 'de' MMMM", { locale: es })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!importe || isNaN(importe)) return
    setGuardando(true)
    await añadirRegistro(importe, tipo, notas, origen)
    toast.success('Servicio añadido')
    setImporte('')
    setNotas('')
    setGuardando(false)
  }

  async function handleGasto(e) {
    e.preventDefault()
    if (!gastoImporte || isNaN(gastoImporte)) return
    setGuardandoGasto(true)
    await añadirGasto(gastoImporte, gastoConcepto)
    toast.success('Gasto añadido')
    setGastoImporte('')
    setGuardandoGasto(false)
  }

  async function handleEfectivo(e) {
    e.preventDefault()
    setGuardandoEfectivo(true)
    await guardarEfectivo(efectivoInput)
    toast.success('Efectivo guardado')
    setGuardandoEfectivo(false)
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <Toaster />

      {!online && (
        <div className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-semibold px-4 py-2 rounded-xl mb-3 text-center">
          ⚡ Modo offline — Los datos se sincronizarán cuando vuelva la conexión
        </div>
      )}

      {/* Selector de fecha */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setFecha(subDays(fecha, 1))}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow text-gray-500 hover:text-yellow-500">
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-gray-700 dark:text-gray-200 capitalize">{fechaLabel}</span>
        <button onClick={() => setFecha(addDays(fecha, 1))} disabled={esHoy}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow text-gray-500 hover:text-yellow-500 disabled:opacity-30">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Resumen del día */}
      <div className="bg-yellow-400 rounded-2xl p-4 mb-4 shadow-lg">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-yellow-900 text-xs font-semibold uppercase tracking-wide">Total facturado</p>
            <p className="text-yellow-900 font-black text-4xl">{total.toFixed(2)} €</p>
            <p className="text-yellow-800 text-xs mt-0.5">{registros.length} servicios</p>
          </div>
          <div className="bg-yellow-300 rounded-xl p-3 text-right">
            <p className="text-yellow-900 text-xs font-semibold">Tu parte ({porcentaje}%)</p>
            <p className="text-yellow-900 font-black text-2xl">{tuParte.toFixed(2)} €</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-yellow-300 rounded-xl p-2 text-center">
            <p className="text-yellow-900 text-xs">🚕 Taxímetro</p>
            <p className="text-yellow-900 font-black text-sm">{totalTaximetro.toFixed(2)}€</p>
          </div>
          <div className="bg-yellow-300 rounded-xl p-2 text-center">
            <p className="text-yellow-900 text-xs">🔴 FreeNow</p>
            <p className="text-yellow-900 font-black text-sm">{totalFreeNow.toFixed(2)}€</p>
          </div>
          <div className="bg-yellow-300 rounded-xl p-2 text-center">
            <p className="text-yellow-900 text-xs">⚫ Uber</p>
            <p className="text-yellow-900 font-black text-sm">{totalUber.toFixed(2)}€</p>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setPestana('servicios')}
          className={`flex-1 py-2 rounded-xl font-semibold text-sm transition
            ${pestana === 'servicios' ? 'bg-yellow-400 text-yellow-900' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow'}`}>
          🚕 Servicios
        </button>
        <button onClick={() => setPestana('gastos')}
          className={`flex-1 py-2 rounded-xl font-semibold text-sm transition
            ${pestana === 'gastos' ? 'bg-red-400 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow'}`}>
          💸 Gastos
        </button>
        <button onClick={() => setPestana('efectivo')}
          className={`flex-1 py-2 rounded-xl font-semibold text-sm transition
            ${pestana === 'efectivo' ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow'}`}>
          💵 Efectivo
        </button>
      </div>

      {pestana === 'servicios' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow space-y-3">
          <h2 className="font-bold text-gray-800 dark:text-gray-100">Añadir servicio</h2>
          <div className="flex gap-2">
            {ORIGENES.map(o => (
              <button key={o.id} type="button" onClick={() => setOrigen(o.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition
                  ${origen === o.id ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="text-2xl font-bold text-gray-400 self-center">€</span>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={importe}
              onChange={e => setImporte(e.target.value)}
              className="flex-1 text-2xl font-bold border-b-2 border-gray-200 dark:border-gray-600 focus:border-yellow-400 outline-none p-1 bg-transparent dark:text-white" />
          </div>
          <div className="flex gap-2">
            {TIPOS.map(t => (
              <button key={t.id} type="button" onClick={() => setTipo(t.id)}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition
                  ${tipo === t.id ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                <t.icon size={18} />
                {t.label}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Notas (opcional)" value={notas}
            onChange={e => setNotas(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-2 text-sm outline-none focus:border-yellow-400 bg-transparent dark:text-white dark:placeholder-gray-500" />
          <button type="submit" disabled={guardando || !importe}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-yellow-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
            <PlusCircle size={20} />
            {guardando ? 'Guardando...' : 'Añadir servicio'}
          </button>
        </form>
      )}

      {pestana === 'gastos' && (
        <form onSubmit={handleGasto} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow space-y-3">
          <h2 className="font-bold text-gray-800 dark:text-gray-100">Añadir gasto <span className="text-xs text-gray-400 font-normal">(opcional)</span></h2>
          <div className="flex gap-2">
            <span className="text-2xl font-bold text-gray-400 self-center">€</span>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={gastoImporte}
              onChange={e => setGastoImporte(e.target.value)}
              className="flex-1 text-2xl font-bold border-b-2 border-gray-200 dark:border-gray-600 focus:border-red-400 outline-none p-1 bg-transparent dark:text-white" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CONCEPTOS_GASTO.map(c => (
              <button key={c} type="button" onClick={() => setGastoConcepto(c)}
                className={`py-1 px-3 rounded-xl text-xs font-semibold transition
                  ${gastoConcepto === c ? 'bg-red-400 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {c}
              </button>
            ))}
          </div>
          <button type="submit" disabled={guardandoGasto || !gastoImporte}
            className="w-full bg-red-400 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
            <PlusCircle size={20} />
            {guardandoGasto ? 'Guardando...' : 'Añadir gasto'}
          </button>
        </form>
      )}

      {pestana === 'efectivo' && (
        <form onSubmit={handleEfectivo} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} className="text-green-500" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Efectivo recaudado</h3>
          </div>
          <p className="text-xs text-gray-400">Anota el total de efectivo cobrado durante el día</p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl px-3">
              <span className="text-gray-400 font-bold">€</span>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={efectivoInput}
                onChange={e => setEfectivoInput(e.target.value)}
                className="flex-1 py-3 outline-none bg-transparent dark:text-white font-bold text-xl" />
            </div>
            <button type="submit" disabled={guardandoEfectivo}
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 rounded-xl transition disabled:opacity-50">
              {guardandoEfectivo ? '...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}