import { useState } from 'react'
import { useRegistros } from '../hooks/useRegistros'
import { PlusCircle, Trash2, Car, Plane, MapPin } from 'lucide-react'

const TIPOS = [
  { id: 'servicio', label: 'Servicio', icon: Car },
  { id: 'aeropuerto', label: 'Aeropuerto', icon: Plane },
  { id: 'largo', label: 'Largo recorrido', icon: MapPin },
]

export default function Hoy() {
  const { registros, loading, total, añadirRegistro, eliminarRegistro } = useRegistros()
  const [importe, setImporte] = useState('')
  const [tipo, setTipo] = useState('servicio')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!importe || isNaN(importe)) return
    setGuardando(true)
    await añadirRegistro(importe, tipo, notas)
    setImporte('')
    setNotas('')
    setGuardando(false)
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="bg-yellow-400 rounded-2xl p-6 mb-6 text-center shadow-lg">
        <p className="text-yellow-900 font-semibold text-sm uppercase tracking-wider">Total hoy</p>
        <p className="text-5xl font-black text-yellow-900 mt-1">{total.toFixed(2)} €</p>
        <p className="text-yellow-800 text-sm mt-1">{registros.length} servicios</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 shadow mb-6 space-y-3">
        <h2 className="font-bold text-gray-800 text-lg">Añadir servicio</h2>
        <div className="flex gap-2">
          <span className="text-2xl font-bold text-gray-400 self-center">€</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={importe}
            onChange={e => setImporte(e.target.value)}
            className="flex-1 text-2xl font-bold border-b-2 border-gray-200 focus:border-yellow-400 outline-none p-1"
          />
        </div>
        <div className="flex gap-2">
          {TIPOS.map(t => (
            <button key={t.id} type="button" onClick={() => setTipo(t.id)}
              className={`flex-1 py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition
                ${tipo === t.id ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-500'}`}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Notas (opcional)"
          value={notas}
          onChange={e => setNotas(e.target.value)}
          className="w-full border border-gray-200 rounded-xl p-2 text-sm outline-none focus:border-yellow-400"
        />
        <button type="submit" disabled={guardando || !importe}
          className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-yellow-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
        >
          <PlusCircle size={20} />
          {guardando ? 'Guardando...' : 'Añadir'}
        </button>
      </form>

      <div className="space-y-2">
        {loading && <p className="text-center text-gray-400">Cargando...</p>}
        {registros.map(r => (
          <div key={r.id} className="bg-white rounded-xl p-3 shadow flex items-center justify-between">
            <div>
              <span className="font-bold text-gray-800 text-lg">{parseFloat(r.importe).toFixed(2)} €</span>
              <div className="flex gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{r.hora?.slice(0,5)}</span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 rounded-full">{r.tipo}</span>
                {r.notas && <span className="text-xs text-gray-400">{r.notas}</span>}
              </div>
            </div>
            <button onClick={() => eliminarRegistro(r.id)} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}