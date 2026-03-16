import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, Calendar, BarChart2 } from 'lucide-react'

function GraficaBarras({ datos, color = '#facc15' }) {
  const maxValor = Math.max(...datos.map(d => d.total), 1)
  return (
    <div className="w-full">
      <div className="flex items-end gap-1 w-full" style={{ height: '160px' }}>
        {datos.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{ height: '100%' }}>
            {d.total > 0 && (
              <span style={{ fontSize: '9px' }} className="text-gray-400 mb-1">
                {d.total.toFixed(0)}€
              </span>
            )}
            <div
              style={{
                width: '100%',
                height: `${Math.max((d.total / maxValor) * 130, d.total > 0 ? 4 : 0)}px`,
                backgroundColor: color,
                borderRadius: '6px 6px 0 0',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 w-full mt-1">
        {datos.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span style={{ fontSize: '10px' }} className="text-gray-400 capitalize">{d.nombre}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Estadisticas() {
  const [stats, setStats] = useState({
    hoy: { total: 0, servicios: 0 },
    semana: { total: 0, servicios: 0 },
    mes: { total: 0, servicios: 0 },
  })
  const [mejorDia, setMejorDia] = useState(null)
  const [mediaDiaria, setMediaDiaria] = useState(0)
  const [datosSemana, setDatosSemana] = useState([])
  const [datosMes, setDatosMes] = useState([])
  const [vistaGrafica, setVistaGrafica] = useState('semana')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  async function cargarEstadisticas() {
    setLoading(true)
    const hoy = new Date()

    const inicioSemana = startOfWeek(hoy, { weekStartsOn: 1 })
    const finSemana = endOfWeek(hoy, { weekStartsOn: 1 })
    const inicioMes = startOfMonth(hoy)
    const finMes = endOfMonth(hoy)
    const hoyStr = format(hoy, 'yyyy-MM-dd')
    const inicioSemanaStr = format(inicioSemana, 'yyyy-MM-dd')
    const finSemanaStr = format(finSemana, 'yyyy-MM-dd')
    const inicioMesStr = format(inicioMes, 'yyyy-MM-dd')
    const finMesStr = format(finMes, 'yyyy-MM-dd')

    const { data } = await supabase
      .from('registros')
      .select('fecha, importe')
      .gte('fecha', inicioMesStr)
      .lte('fecha', finMesStr)

    if (data) {
      const registrosHoy = data.filter(r => r.fecha === hoyStr)
      const totalHoy = registrosHoy.reduce((acc, r) => acc + parseFloat(r.importe), 0)

      const registrosSemana = data.filter(r => r.fecha >= inicioSemanaStr && r.fecha <= finSemanaStr)
      const totalSemana = registrosSemana.reduce((acc, r) => acc + parseFloat(r.importe), 0)

      const totalMes = data.reduce((acc, r) => acc + parseFloat(r.importe), 0)

      const porDia = data.reduce((acc, r) => {
        if (!acc[r.fecha]) acc[r.fecha] = 0
        acc[r.fecha] += parseFloat(r.importe)
        return acc
      }, {})

      const diasOrdenados = Object.entries(porDia).sort((a, b) => b[1] - a[1])
      if (diasOrdenados.length > 0) {
        setMejorDia({ fecha: diasOrdenados[0][0], total: diasOrdenados[0][1] })
      }

      const numDias = Object.keys(porDia).length
      setMediaDiaria(numDias > 0 ? totalMes / numDias : 0)

      setStats({
        hoy: { total: totalHoy, servicios: registrosHoy.length },
        semana: { total: totalSemana, servicios: registrosSemana.length },
        mes: { total: totalMes, servicios: data.length },
      })

      const diasSemana = eachDayOfInterval({ start: inicioSemana, end: finSemana })
      setDatosSemana(diasSemana.map(dia => ({
        nombre: format(dia, 'EEE', { locale: es }),
        total: porDia[format(dia, 'yyyy-MM-dd')] || 0
      })))

      const diasMes = eachDayOfInterval({ start: inicioMes, end: finMes })
      setDatosMes(diasMes.map(dia => ({
        nombre: format(dia, 'd'),
        total: porDia[format(dia, 'yyyy-MM-dd')] || 0
      })))
    }
    setLoading(false)
  }

  if (loading) return <p className="text-center text-gray-400 mt-8">Cargando...</p>

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="font-bold text-gray-800 dark:text-gray-100 text-xl flex items-center gap-2">
        <BarChart2 size={22} /> Estadísticas
      </h2>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-400 rounded-2xl p-3 text-center shadow">
          <p className="text-yellow-900 text-xs font-semibold uppercase tracking-wide">Hoy</p>
          <p className="text-yellow-900 font-black text-xl mt-1">{stats.hoy.total.toFixed(2)}€</p>
          <p className="text-yellow-800 text-xs">{stats.hoy.servicios} serv.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 text-center shadow">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Semana</p>
          <p className="text-gray-800 dark:text-white font-black text-xl mt-1">{stats.semana.total.toFixed(2)}€</p>
          <p className="text-gray-400 text-xs">{stats.semana.servicios} serv.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 text-center shadow">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wide">Mes</p>
          <p className="text-gray-800 dark:text-white font-black text-xl mt-1">{stats.mes.total.toFixed(2)}€</p>
          <p className="text-gray-400 text-xs">{stats.mes.servicios} serv.</p>
        </div>
      </div>

      {/* Gráfica */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-700 dark:text-gray-200">Facturación</h3>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button onClick={() => setVistaGrafica('semana')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition
                ${vistaGrafica === 'semana' ? 'bg-yellow-400 text-yellow-900' : 'text-gray-500 dark:text-gray-400'}`}>
              Semana
            </button>
            <button onClick={() => setVistaGrafica('mes')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition
                ${vistaGrafica === 'mes' ? 'bg-yellow-400 text-yellow-900' : 'text-gray-500 dark:text-gray-400'}`}>
              Mes
            </button>
          </div>
        </div>
        <GraficaBarras datos={vistaGrafica === 'semana' ? datosSemana : datosMes} />
      </div>

      {/* Media diaria */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow flex items-center gap-3">
        <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-xl">
          <TrendingUp size={20} className="text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Media diaria este mes</p>
          <p className="font-black text-gray-800 dark:text-white text-2xl">{mediaDiaria.toFixed(2)} €</p>
        </div>
      </div>

      {/* Mejor día */}
      {mejorDia && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow flex items-center gap-3">
          <div className="bg-green-100 dark:bg-green-900 p-2 rounded-xl">
            <Calendar size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Mejor día del mes</p>
            <p className="font-bold text-gray-800 dark:text-white capitalize">
              {format(new Date(mejorDia.fecha + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <p className="font-black text-green-500 text-xl">{mejorDia.total.toFixed(2)} €</p>
          </div>
        </div>
      )}
    </div>
  )
}