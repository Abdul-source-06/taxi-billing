import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronRight, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Historial() {
  const [dias, setDias] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarHistorial()
  }, [])

  async function cargarHistorial() {
    setLoading(true)
    const { data } = await supabase
      .from('registros')
      .select('fecha, importe')
      .order('fecha', { ascending: false })

    if (data) {
      // Agrupa por fecha
      const agrupado = data.reduce((acc, r) => {
        if (!acc[r.fecha]) acc[r.fecha] = { fecha: r.fecha, total: 0, servicios: 0 }
        acc[r.fecha].total += parseFloat(r.importe)
        acc[r.fecha].servicios += 1
        return acc
      }, {})
      setDias(Object.values(agrupado))
    }
    setLoading(false)
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="font-bold text-gray-800 text-xl mb-4 flex items-center gap-2">
        <Calendar size={22} /> Historial
      </h2>

      {loading && <p className="text-center text-gray-400">Cargando...</p>}

      <div className="space-y-2">
        {dias.map(dia => (
          <div key={dia.fecha} className="bg-white rounded-xl p-4 shadow flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-800 capitalize">
                {format(new Date(dia.fecha + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-sm text-gray-400">{dia.servicios} servicios</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black text-yellow-500 text-lg">{dia.total.toFixed(2)} €</span>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </div>
        ))}

        {!loading && dias.length === 0 && (
          <p className="text-center text-gray-400 mt-8">No hay registros aún</p>
        )}
      </div>
    </div>
  )
}