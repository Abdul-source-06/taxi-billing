import { useState } from 'react'
import { useRegistros } from '../hooks/useRegistros'
import { PlusCircle, ChevronLeft, ChevronRight, Wallet, Gift } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import toast, { Toaster } from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

const ORIGENES = [
  { id: 'taximetro', label: 'Taxímetro', emoji: '🚕', logo: null },
  { id: 'freenow', label: 'FreeNow', emoji: null, logo: '/freenow.png' },
  { id: 'uber', label: 'Uber', emoji: null, logo: '/uber.png' },
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
    efectivo, propinas,
    añadirRegistro, añadirGasto, guardarEfectivo, guardarPropinas
  } = useRegistros(fecha)

  const [pestana, setPestana] = useState('servicios')
  const [importe, setImporte] = useState('')
  const [origen, setOrigen] = useState('taximetro')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [gastoImporte, setGastoImporte] = useState('')
  const [gastoConcepto, setGastoConcepto] = useState('Gasolina')
  const [guardandoGasto, setGuardandoGasto] = useState(false)

  const [efectivoInput, setEfectivoInput] = useState('')
  const [guardandoEfectivo, setGuardandoEfectivo] = useState(false)

  const [propinaInput, setPropinaInput] = useState('')
  const [guardandoPropina, setGuardandoPropina] = useState(false)

  const esHoy = isToday(fecha)
  const fechaLabel = esHoy ? 'Hoy' : format(fecha, "EEEE d 'de' MMMM", { locale: es })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!importe || isNaN(importe)) return
    setGuardando(true)
    await añadirRegistro(importe, 'servicio', notas, origen)
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
    if (!efectivoInput || isNaN(efectivoInput)) return
    setGuardandoEfectivo(true)
    const nuevoTotal = (efectivo || 0) + parseFloat(efectivoInput)
    await guardarEfectivo(nuevoTotal)
    toast.success(`Efectivo guardado — Total: ${nuevoTotal.toFixed(2)} €`)
    setEfectivoInput('')
    setGuardandoEfectivo(false)
  }

  async function handlePropina(e) {
    e.preventDefault()
    if (!propinaInput || isNaN(propinaInput)) return
    setGuardandoPropina(true)
    const nuevoTotal = (propinas || 0) + parseFloat(propinaInput)
    await guardarPropinas(nuevoTotal)
    toast.success(`Propina guardada — Total: ${nuevoTotal.toFixed(2)} €`)
    setPropinaInput('')
    setGuardandoPropina(false)
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
            <div className="flex items-center justify-center gap-1">
              <img src="/freenow.png" alt="FreeNow" className="h-3 object-contain" />
            </div>
            <p className="text-yellow-900 font-black text-sm">{totalFreeNow.toFixed(2)}€</p>
          </div>
          <div className="bg-yellow-300 rounded-xl p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <img src="/uber.png" alt="Uber" className="h-3 object-contain" />
            </div>
            <p className="text-yellow-900 font-black text-sm">{totalUber.toFixed(2)}€</p>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="grid grid-cols-3 gap-1 mb-4">
        <button onClick={() => setPestana('servicios')}
          className={`py-2 rounded-xl font-semibold text-xs transition
            ${pestana === 'servicios' ? 'bg-yellow-400 text-yellow-900' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow'}`}>
          🚕 Servicios
        </button>
        <button onClick={() => setPestana('efectivo')}
          className={`py-2 rounded-xl font-semibold text-xs transition
            ${pestana === 'efectivo' ? 'bg-green-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow'}`}>
          💵 Efectivo
        </button>
        <button onClick={() => setPestana('propinas')}
          className={`py-2 rounded-xl font-semibold text-xs transition
            ${pestana === 'propinas' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow'}`}>
          💲 Propinas
        </button>
      </div>

      {/* Servicios */}
      {pestana === 'servicios' && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow space-y-3">
          <h2 className="font-bold text-gray-800 dark:text-gray-100">Añadir servicio</h2>
          <div className="flex gap-2">
            {ORIGENES.map(o => (
              <button key={o.id} type="button" onClick={() => setOrigen(o.id)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1
                  ${origen === o.id ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {o.logo
                  ? <img src={o.logo} alt={o.label} className="h-4 object-contain" />
                  : <span>{o.emoji}</span>
                }
                <span>{o.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="text-2xl font-bold text-gray-400 self-center">€</span>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={importe}
              onChange={e => setImporte(e.target.value)}
              className="flex-1 text-2xl font-bold border-b-2 border-gray-200 dark:border-gray-600 focus:border-yellow-400 outline-none p-1 bg-transparent dark:text-white" />
          </div>
          <input type="text" placeholder="Notas (opcional)" value={notas}
            onChange={e => setNotas(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-2 text-sm outline-none focus:border-yellow-400 bg-transparent dark:text-white dark:placeholder-gray-500" />
          <button type="submit" disabled={guardando || !importe}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-yellow-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
            <PlusCircle size={20} />
            {guardando ? 'Guardando...' : 'Añadir'}
          </button>
        </form>
      )}

      {/* Efectivo */}
      {pestana === 'efectivo' && (
        <form onSubmit={handleEfectivo} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} className="text-green-500" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Efectivo recaudado</h3>
          </div>
          <p className="text-xs text-gray-400">Anota el total de efectivo cobrado durante el día</p>
          {efectivo > 0 && (
            <div className="bg-green-50 dark:bg-green-900 rounded-xl px-4 py-2 flex items-center justify-between">
              <span className="text-green-700 dark:text-green-300 text-sm font-semibold">Total acumulado</span>
              <span className="text-green-700 dark:text-green-300 font-black text-lg">{efectivo.toFixed(2)} €</span>
            </div>
          )}
          <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl px-3">
            <span className="text-gray-400 font-bold">€</span>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={efectivoInput}
              onChange={e => setEfectivoInput(e.target.value)}
              className="flex-1 py-3 outline-none bg-transparent dark:text-white font-bold text-xl w-full" />
          </div>
          <button type="submit" disabled={guardandoEfectivo}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
            {guardandoEfectivo ? 'Guardando...' : 'Guardar efectivo'}
          </button>
        </form>
      )}

      {/* Propinas */}
      {pestana === 'propinas' && (
        <form onSubmit={handlePropina} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={18} className="text-purple-500" />
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Propinas del día</h3>
          </div>
          <p className="text-xs text-gray-400">Añade las propinas recibidas durante el día</p>
          {propinas > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900 rounded-xl px-4 py-2 flex items-center justify-between">
              <span className="text-purple-700 dark:text-purple-300 text-sm font-semibold">Total acumulado</span>
              <span className="text-purple-700 dark:text-purple-300 font-black text-lg">{propinas.toFixed(2)} €</span>
            </div>
          )}
          <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-xl px-3">
            <span className="text-gray-400 font-bold">€</span>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={propinaInput}
              onChange={e => setPropinaInput(e.target.value)}
              className="flex-1 py-3 outline-none bg-transparent dark:text-white font-bold text-xl w-full" />
          </div>
          <button type="submit" disabled={guardandoPropina}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
            {guardandoPropina ? 'Guardando...' : 'Guardar propina'}
          </button>
        </form>
      )}
    </div>
  )
}