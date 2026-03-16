import { useState } from 'react'
import { useRegistros } from '../hooks/useRegistros'
import { PlusCircle, Trash2, Car, Plane, MapPin, Pencil, X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import toast, { Toaster } from 'react-hot-toast'
import BotonExportar from '../components/BotonExportar'

const TIPOS = [
  { id: 'servicio', label: 'Servicio', icon: Car },
  { id: 'aeropuerto', label: 'Aeropuerto', icon: Plane },
  { id: 'largo', label: 'Largo recorrido', icon: MapPin },
]

const CONCEPTOS_GASTO = ['Gasolina', 'Parking', 'Peaje', 'Mantenimiento', 'Otros']

export default function Hoy() {
  const [fecha, setFecha] = useState(new Date())
  const {
    registros, gastos, loading, online,
    total, totalGastos, beneficioNeto,
    añadirRegistro, editarRegistro, eliminarRegistro,
    añadirGasto, eliminarGasto
  } = useRegistros(fecha)

  const [pestana, setPestana] = useState('ingresos')
  const [importe, setImporte] = useState('')
  const [tipo, setTipo] = useState('servicio')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [gastoImporte, setGastoImporte] = useState('')
  const [gastoConcepto, setGastoConcepto] = useState('Gasolina')
  const [guardandoGasto, setGuardandoGasto] = useState(false)

  const [editandoId, setEditandoId] = useState(null)
  const [editImporte, setEditImporte] = useState('')
  const [editTipo, setEditTipo] = useState('servicio')
  const [editNotas, setEditNotas] = useState('')

  const esHoy = isToday(fecha)
  const fechaLabel = esHoy ? 'Hoy' : format(fecha, "EEEE d 'de' MMMM", { locale: es })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!importe || isNaN(importe)) return
    setGuardando(true)
    await añadirRegistro(importe, tipo, notas)
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

  function iniciarEdicion(r) {
    setEditandoId(r.id)
    setEditImporte(r.importe)
    setEditTipo(r.tipo)
    setEditNotas(r.notas || '')
  }

  async function guardarEdicion(id) {
    await editarRegistro(id, editImporte, editTipo, editNotas)
    toast.success('Registro actualizado')
    setEditandoId(null)
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
        <div className="flex items-center gap-2">
          <BotonExportar fecha={fecha} registros={registros} gastos={gastos}
            total={total} totalGastos={totalGastos} beneficioNeto={beneficioNeto} />
          <button onClick={() => setFecha(addDays(fecha, 1))} disabled={esHoy}
            className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow text-gray-500 hover:text-yellow-500 disabled:opacity-30">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-yellow-400 rounded-2xl p-3 text-center shadow">
          <p className="text-yellow-900 text-xs font-semibold uppercase">Ingresos</p>
          <p className="text-yellow-900 font-black text-lg mt-1">{total.toFixed(2)}€</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900 rounded-2xl p-3 text-center shadow">
          <p className="text-red-600 dark:text-red-300 text-xs font-semibold uppercase">Gastos</p>
          <p className="text-red-600 dark:text-red-300 font-black text-lg mt-1">{totalGastos.toFixed(2)}€</p>
        </div>
        <div className={`${beneficioNeto >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} rounded-2xl p-3 text-center shadow`}>
          <p className={`${beneficioNeto >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'} text-xs font-semibold uppercase`}>Neto</p>
          <p className={`${beneficioNeto >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'} font-black text-lg mt-1`}>{beneficioNeto.toFixed(2)}€</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setPestana('ingresos')}
          className={`flex-1 py-2 rounded-xl font-semibold text-sm transition
            ${pestana === 'ingresos' ? 'bg-yellow-400 text-yellow-900' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow'}`}>
          🚕 Servicios ({registros.length})
        </button>
        <button onClick={() => setPestana('gastos')}
          className={`flex-1 py-2 rounded-xl font-semibold text-sm transition
            ${pestana === 'gastos' ? 'bg-red-400 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow'}`}>
          💸 Gastos ({gastos.length})
        </button>
      </div>

      {pestana === 'ingresos' ? (
        <>
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow mb-4 space-y-3">
            <h2 className="font-bold text-gray-800 dark:text-gray-100">Añadir servicio</h2>
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

          <div className="space-y-2">
            {loading && <p className="text-center text-gray-400">Cargando...</p>}
            {registros.map(r => (
              <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow transition-all duration-200">
                {editandoId === r.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <span className="text-gray-400 font-bold">€</span>
                      <input type="number" step="0.01" value={editImporte}
                        onChange={e => setEditImporte(e.target.value)}
                        className="flex-1 font-bold border-b-2 border-yellow-400 outline-none p-1 bg-transparent dark:text-white" />
                    </div>
                    <div className="flex gap-2">
                      {TIPOS.map(t => (
                        <button key={t.id} type="button" onClick={() => setEditTipo(t.id)}
                          className={`flex-1 py-1 rounded-lg text-xs font-semibold transition
                            ${editTipo === t.id ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <input type="text" value={editNotas} onChange={e => setEditNotas(e.target.value)}
                      placeholder="Notas"
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-1 text-sm outline-none bg-transparent dark:text-white" />
                    <div className="flex gap-2">
                      <button onClick={() => guardarEdicion(r.id)}
                        className="flex-1 bg-yellow-400 text-yellow-900 font-bold py-1 rounded-lg flex items-center justify-center gap-1">
                        <Check size={16} /> Guardar
                      </button>
                      <button onClick={() => setEditandoId(null)}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-500 font-bold py-1 rounded-lg flex items-center justify-center gap-1">
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-800 dark:text-white text-lg">{parseFloat(r.importe).toFixed(2)} €</span>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{r.hora?.slice(0, 5)}</span>
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 rounded-full">{r.tipo}</span>
                        {r.notas && <span className="text-xs text-gray-400">{r.notas}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => iniciarEdicion(r)} className="text-blue-400 hover:text-blue-600 p-1">
                        <Pencil size={17} />
                      </button>
                      <button onClick={() => { eliminarRegistro(r.id); toast.success('Eliminado') }} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!loading && registros.length === 0 && (
              <p className="text-center text-gray-400 mt-4">No hay servicios este día</p>
            )}
          </div>
        </>
      ) : (
        <>
          <form onSubmit={handleGasto} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow mb-4 space-y-3">
            <h2 className="font-bold text-gray-800 dark:text-gray-100">Añadir gasto</h2>
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

          <div className="space-y-2">
            {loading && <p className="text-center text-gray-400">Cargando...</p>}
            {gastos.map(g => (
              <div key={g.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-red-500 text-lg">{parseFloat(g.importe).toFixed(2)} €</span>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{g.hora?.slice(0, 5)}</span>
                      <span className="text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 rounded-full">{g.concepto}</span>
                    </div>
                  </div>
                  <button onClick={() => { eliminarGasto(g.id); toast.success('Gasto eliminado') }}
                    className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
            {!loading && gastos.length === 0 && (
              <p className="text-center text-gray-400 mt-4">No hay gastos este día</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}