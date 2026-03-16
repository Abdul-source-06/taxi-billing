import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, Calendar, BarChart2 } from 'lucide-react'

export default function Estadisticas() {
  const [stats, setStats] = useState({
    hoy: { total: 0, servicios: 0 },
    semana: { total: 0, servicios: 0 },
    mes: { total: 0, servicios: 0 },
  })
  const [mejorDia, setMejorDia] = useState(null)
  const [mediaDiaria, setMediaDiaria] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  async function cargarEstadisticas() {
    setLoading(true)
    const hoy = new Date()

    const inicioSemana = format(startOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const finSemana = format(endOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const inicioMes = format(startOfMonth(hoy), 'yyyy-MM-dd')
    const finMes = format(endOfMonth(hoy), 'yyyy-MM-dd')
    const hoyStr = format(hoy, 'yyyy-MM-dd')

    const { data } = await supabase
      .from('registros')
      .select('fecha, importe')
      .gte('fecha', inicioMes)
      .lte('fecha', finMes)

    if (data) {
      // Stats de hoy
      const registrosHoy = data.filter(r => r.fecha === hoyStr)
      const totalHoy = registrosHoy.reduce((acc, r) => acc + parseFloat(r.importe), 0)

      // Stats de la semana
      const registrosSemana = data.filter(r => r.fecha >= inicioSemana && r.fecha <= finSemana)
      const totalSemana = registrosSemana.reduce((acc, r) => acc + parseFloat(r.importe), 0)

      // Stats del mes
      const totalMes = data.reduce((acc, r) => acc + parseFloat(r.importe), 0)

      // Mejor día
      const porDia = data.reduce((acc, r) => {
        if (!acc[r.fecha]) acc[r.fecha] = 0
        acc[r.fecha] += parseFloat(r.importe)
        return acc
      }, {})

      const diasOrdenados = Object.entries(porDia).sort((a, b) => b[1] - a[1])
      if (diasOrdenados.length > 0) {
        setMejorDia({ fecha: diasOrdenados[0][0], total: diasOrdenados[0][1] })
      }

      // Media diaria
      const numDias = Object.keys(porDia).length
      setMediaDiaria(numDias > 0 ? totalMes / numDias : 0)

      setStats({
        hoy: { total: totalHoy, servicios: registrosHoy.length },
        semana: { total: totalSemana, servicios: registrosSemana.length },
        mes: { total: totalMes, servicios: data.length },
      })
    }
    setLoading(false)
  }

  if (loading) return <p className="text-center text-gray-400 mt-8">Cargando...</p>

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="font-bold text-gray-800 text-xl flex items-center gap-2">
        <BarChart2 size={22} /> Estadísticas
      </h2>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-400 rounded-2xl p-3 text-center shadow">
          <p className="text-yellow-900 text-xs font-semibold uppercase tracking-wide">Hoy</p>
          <p className="text-yellow-900 font-black text-xl mt-1">{stats.hoy.total.toFixed(2)}€</p>
          <p className="text-yellow-800 text-xs">{stats.hoy.servicios} serv.</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Semana</p>
          <p className="text-gray-800 font-black text-xl mt-1">{stats.semana.total.toFixed(2)}€</p>
          <p className="text-gray-400 text-xs">{stats.semana.servicios} serv.</p>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Mes</p>
          <p className="text-gray-800 font-black text-xl mt-1">{stats.mes.total.toFixed(2)}€</p>
          <p className="text-gray-400 text-xs">{stats.mes.servicios} serv.</p>
        </div>
      </div>

      {/* Media diaria */}
      <div className="bg-white rounded-2xl p-4 shadow flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-xl">
            <TrendingUp size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Media diaria</p>
            <p className="font-black text-gray-800 text-2xl">{mediaDiaria.toFixed(2)} €</p>
          </div>
        </div>
      </div>

      {/* Mejor día */}
      {mejorDia && (
        <div className="bg-white rounded-2xl p-4 shadow flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-xl">
              <Calendar size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Mejor día del mes</p>
              <p className="font-bold text-gray-800 capitalize">
                {format(new Date(mejorDia.fecha + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="font-black text-green-500 text-xl">{mejorDia.total.toFixed(2)} €</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}