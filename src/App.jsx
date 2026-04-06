import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Moon, Sun, MoreVertical, LogOut, Bell, Download, X, ChevronLeft, ChevronRight } from 'lucide-react'
import BottomNav from './components/BottomNav'
import Hoy from './pages/Hoy'
import Historial from './pages/Historial'
import Estadisticas from './pages/Estadisticas'
import Ajustes from './pages/Ajustes'
import Login from './pages/Login'
import { useAuth } from './hooks/useAuth'
import { useModoOscuro } from './hooks/useModoOscuro'
import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from './lib/supabase'
import { exportarPDF, exportarExcel, exportarPDFSemana, exportarExcelSemana } from './lib/exportar'
import toast from 'react-hot-toast'

function Menu({ onClose, oscuro, toggleOscuro, logout }) {
  const [exportando, setExportando] = useState(false)
  const [seccionExport, setSeccionExport] = useState(null) // 'mes' | 'semana'
  const [fechaMes, setFechaMes] = useState(new Date())
  const [fechaSemana, setFechaSemana] = useState(new Date())

  async function handleExportar(tipo, periodo) {
    setExportando(true)
    const porcentaje = parseFloat(localStorage.getItem('porcentaje') || '45')

    let inicio, fin, fecha

    if (periodo === 'mes') {
      inicio = format(startOfMonth(fechaMes), 'yyyy-MM-dd')
      fin = format(endOfMonth(fechaMes), 'yyyy-MM-dd')
      fecha = format(fechaMes, 'yyyy-MM-dd')
    } else {
      inicio = format(startOfWeek(fechaSemana, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      fin = format(endOfWeek(fechaSemana, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      fecha = format(fechaSemana, 'yyyy-MM-dd')
    }

   const { data: { session } } = await supabase.auth.getSession()
const user_id = session?.user?.id

const [{ data: registros }, { data: gastos }, { data: dataEfectivo }] = await Promise.all([
  supabase.from('registros').select('*').eq('user_id', user_id).gte('fecha', inicio).lte('fecha', fin),
  supabase.from('gastos').select('*').eq('user_id', user_id).gte('fecha', inicio).lte('fecha', fin),
  supabase.from('efectivo_dia').select('*').eq('user_id', user_id).gte('fecha', inicio).lte('fecha', fin),
])

    const total = (registros || []).reduce((acc, r) => acc + parseFloat(r.importe), 0)
const totalGastos = (gastos || []).reduce((acc, g) => acc + parseFloat(g.importe), 0)
const beneficioNeto = total - totalGastos
const efectivoTotal = (dataEfectivo || []).reduce((acc, e) => acc + parseFloat(e.importe), 0)

if (periodo === 'mes') {
  if (tipo === 'pdf') exportarPDF(fecha, registros || [], gastos || [], total, totalGastos, beneficioNeto, efectivoTotal, porcentaje, dataEfectivo || [])
  else exportarExcel(fecha, registros || [], gastos || [], total, totalGastos, beneficioNeto, efectivoTotal, porcentaje, dataEfectivo || [])
} else {
  if (tipo === 'pdf') exportarPDFSemana(fecha, registros || [], gastos || [], total, totalGastos, beneficioNeto, efectivoTotal, porcentaje, dataEfectivo || [])
  else exportarExcelSemana(fecha, registros || [], gastos || [], total, totalGastos, beneficioNeto, efectivoTotal, porcentaje, dataEfectivo || [])
}

    toast.success('Exportado correctamente')
    setExportando(false)
    setSeccionExport(null)
  }

  async function handleNotificaciones() {
    const permiso = await Notification.requestPermission()
    if (permiso === 'granted') {
      toast.success('Notificaciones activadas')
    } else {
      toast.error('Permiso denegado')
    }
    onClose()
  }

  const labelMes = format(fechaMes, 'MMMM yyyy', { locale: es })
  const labelSemana = `${format(startOfWeek(fechaSemana, { weekStartsOn: 1 }), "d MMM", { locale: es })} – ${format(endOfWeek(fechaSemana, { weekStartsOn: 1 }), "d MMM", { locale: es })}`

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={onClose} />
      <div className="fixed top-0 right-0 z-50 h-full w-72 shadow-2xl overflow-y-auto"
        style={{ backgroundColor: oscuro ? '#1f2937' : '#ffffff', animation: 'slideIn 0.25s ease-out' }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes fadeInUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>

        {/* Cabecera */}
        <div className="flex items-center justify-between px-5"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)', paddingBottom: '20px', borderBottom: `1px solid ${oscuro ? '#374151' : '#f3f4f6'}` }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚕</span>
            <span className="font-black text-lg" style={{ color: oscuro ? '#f9fafb' : '#111827' }}>TaxiBill</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition"
            style={{ backgroundColor: oscuro ? '#374151' : '#f3f4f6', color: oscuro ? '#9ca3af' : '#6b7280' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-2">

          {/* Modo oscuro */}
          <button onClick={() => { toggleOscuro(); onClose() }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition"
            style={{ backgroundColor: oscuro ? '#374151' : '#f9fafb', animation: 'fadeInUp 0.2s ease-out 0.05s both' }}>
            <div className="p-2 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
              {oscuro ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-yellow-500" />}
            </div>
            <div className="text-left">
              <p className="font-bold text-sm" style={{ color: oscuro ? '#f9fafb' : '#111827' }}>{oscuro ? 'Modo claro' : 'Modo oscuro'}</p>
              <p className="text-xs" style={{ color: oscuro ? '#9ca3af' : '#6b7280' }}>{oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}</p>
            </div>
          </button>

          {/* Notificaciones */}
          <button onClick={handleNotificaciones}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition"
            style={{ backgroundColor: oscuro ? '#374151' : '#f9fafb', animation: 'fadeInUp 0.2s ease-out 0.1s both' }}>
            <div className="p-2 rounded-xl" style={{ backgroundColor: '#dbeafe' }}>
              <Bell size={20} className="text-blue-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm" style={{ color: oscuro ? '#f9fafb' : '#111827' }}>Notificaciones</p>
              <p className="text-xs" style={{ color: oscuro ? '#9ca3af' : '#6b7280' }}>Activar alertas del día</p>
            </div>
          </button>

          {/* Separador exportar */}
          <div className="pt-1 pb-1">
            <p className="text-xs font-bold px-1" style={{ color: oscuro ? '#6b7280' : '#9ca3af' }}>EXPORTAR INFORME</p>
          </div>

          {/* 4 botones de exportar */}
          {[
            { label: 'PDF Mensual', sub: 'Informe del mes', tipo: 'pdf', periodo: 'mes', bg: '#fee2e2', iconColor: 'text-red-500', delay: '0.15s' },
            { label: 'Excel Mensual', sub: 'Informe del mes', tipo: 'excel', periodo: 'mes', bg: '#dcfce7', iconColor: 'text-green-500', delay: '0.18s' },
            { label: 'PDF Semanal', sub: 'Informe de la semana', tipo: 'pdf', periodo: 'semana', bg: '#fee2e2', iconColor: 'text-red-500', delay: '0.21s' },
            { label: 'Excel Semanal', sub: 'Informe de la semana', tipo: 'excel', periodo: 'semana', bg: '#dcfce7', iconColor: 'text-green-500', delay: '0.24s' },
          ].map(btn => (
            <button key={btn.label}
              onClick={() => setSeccionExport(seccionExport === `${btn.tipo}-${btn.periodo}` ? null : `${btn.tipo}-${btn.periodo}`)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition"
              style={{ backgroundColor: oscuro ? '#374151' : '#f9fafb', animation: `fadeInUp 0.2s ease-out ${btn.delay} both` }}>
              <div className="p-2 rounded-xl" style={{ backgroundColor: btn.bg }}>
                <Download size={20} className={btn.iconColor} />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-sm" style={{ color: oscuro ? '#f9fafb' : '#111827' }}>{btn.label}</p>
                <p className="text-xs" style={{ color: oscuro ? '#9ca3af' : '#6b7280' }}>{btn.sub}</p>
              </div>
            </button>
          ))}

          {/* Selector mes */}
          {(seccionExport === 'pdf-mes' || seccionExport === 'excel-mes') && (
            <div className="rounded-2xl p-3 space-y-2" style={{ backgroundColor: oscuro ? '#111827' : '#f3f4f6' }}>
              <p className="text-xs font-bold" style={{ color: oscuro ? '#9ca3af' : '#6b7280' }}>Selecciona el mes</p>
              <div className="flex items-center justify-between">
                <button onClick={() => setFechaMes(subMonths(fechaMes, 1))}
                  className="p-1 rounded-lg" style={{ backgroundColor: oscuro ? '#374151' : '#e5e7eb' }}>
                  <ChevronLeft size={16} className={oscuro ? 'text-gray-300' : 'text-gray-600'} />
                </button>
                <span className="font-bold text-sm capitalize" style={{ color: oscuro ? '#f9fafb' : '#111827' }}>{labelMes}</span>
                <button onClick={() => setFechaMes(addMonths(fechaMes, 1))}
                  disabled={format(fechaMes, 'yyyy-MM') === format(new Date(), 'yyyy-MM')}
                  className="p-1 rounded-lg disabled:opacity-30" style={{ backgroundColor: oscuro ? '#374151' : '#e5e7eb' }}>
                  <ChevronRight size={16} className={oscuro ? 'text-gray-300' : 'text-gray-600'} />
                </button>
              </div>
              <button
                onClick={() => handleExportar(seccionExport.split('-')[0], 'mes')}
                disabled={exportando}
                className="w-full py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                style={{ backgroundColor: '#facc15', color: '#78350f' }}>
                {exportando ? 'Exportando...' : `Descargar ${seccionExport.split('-')[0].toUpperCase()}`}
              </button>
            </div>
          )}

          {/* Selector semana */}
          {(seccionExport === 'pdf-semana' || seccionExport === 'excel-semana') && (
            <div className="rounded-2xl p-3 space-y-2" style={{ backgroundColor: oscuro ? '#111827' : '#f3f4f6' }}>
              <p className="text-xs font-bold" style={{ color: oscuro ? '#9ca3af' : '#6b7280' }}>Selecciona la semana</p>
              <div className="flex items-center justify-between">
                <button onClick={() => setFechaSemana(subWeeks(fechaSemana, 1))}
                  className="p-1 rounded-lg" style={{ backgroundColor: oscuro ? '#374151' : '#e5e7eb' }}>
                  <ChevronLeft size={16} className={oscuro ? 'text-gray-300' : 'text-gray-600'} />
                </button>
                <span className="font-bold text-xs capitalize" style={{ color: oscuro ? '#f9fafb' : '#111827' }}>{labelSemana}</span>
                <button onClick={() => setFechaSemana(addWeeks(fechaSemana, 1))}
                  disabled={format(startOfWeek(fechaSemana, { weekStartsOn: 1 }), 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')}
                  className="p-1 rounded-lg disabled:opacity-30" style={{ backgroundColor: oscuro ? '#374151' : '#e5e7eb' }}>
                  <ChevronRight size={16} className={oscuro ? 'text-gray-300' : 'text-gray-600'} />
                </button>
              </div>
              <button
                onClick={() => handleExportar(seccionExport.split('-')[0], 'semana')}
                disabled={exportando}
                className="w-full py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                style={{ backgroundColor: '#facc15', color: '#78350f' }}>
                {exportando ? 'Exportando...' : `Descargar ${seccionExport.split('-')[0].toUpperCase()}`}
              </button>
            </div>
          )}

          <div className="my-2" style={{ borderTop: `1px solid ${oscuro ? '#374151' : '#f3f4f6'}` }} />

          {/* Cerrar sesión */}
          <button onClick={() => { logout(); onClose() }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition"
            style={{ backgroundColor: '#fef2f2', animation: 'fadeInUp 0.2s ease-out 0.3s both' }}>
            <div className="p-2 rounded-xl" style={{ backgroundColor: '#fee2e2' }}>
              <LogOut size={20} className="text-red-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm text-red-500">Cerrar sesión</p>
              <p className="text-xs text-red-400">Salir de la cuenta</p>
            </div>
          </button>
        </div>
      </div>
    </>
  )
}

function AppContent() {
  const { user, loading, logout } = useAuth()
  const { oscuro, toggleOscuro } = useModoOscuro()
  const [menuAbierto, setMenuAbierto] = useState(false)

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <span className="text-4xl animate-bounce">🚕</span>
    </div>
  )

  if (!user) return <Login />

  const headerHeight = 'calc(env(safe-area-inset-top) + 88px)'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
      style={{ paddingTop: headerHeight, paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
      <Toaster />

      <header
        className="bg-yellow-400 dark:bg-yellow-500 px-4 flex items-center justify-between shadow fixed top-0 left-0 right-0 z-30"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingBottom: '16px' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚕</span>
          <h1 className="font-black text-yellow-900 text-xl">TaxiBill</h1>
        </div>
        <button onClick={() => setMenuAbierto(true)}
          className="p-2 rounded-xl bg-yellow-300 hover:bg-yellow-200 transition">
          <MoreVertical size={22} className="text-yellow-900" />
        </button>
      </header>

      {menuAbierto && (
        <Menu
          onClose={() => setMenuAbierto(false)}
          oscuro={oscuro}
          toggleOscuro={toggleOscuro}
          logout={logout}
        />
      )}

      <Routes>
        <Route path="/" element={<Hoy />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  )
}