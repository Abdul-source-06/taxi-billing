import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Moon, Sun, MoreVertical, LogOut, Bell, Download, X } from 'lucide-react'
import BottomNav from './components/BottomNav'
import Hoy from './pages/Hoy'
import Historial from './pages/Historial'
import Estadisticas from './pages/Estadisticas'
import Ajustes from './pages/Ajustes'
import Login from './pages/Login'
import { useAuth } from './hooks/useAuth'
import { useModoOscuro } from './hooks/useModoOscuro'
import { useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from './lib/supabase'
import { exportarPDF, exportarExcel } from './lib/exportar'
import toast from 'react-hot-toast'

function Menu({ onClose, oscuro, toggleOscuro, logout }) {
  const [exportando, setExportando] = useState(false)

  async function handleExportar(tipo) {
    setExportando(true)
    const hoy = new Date()
    const inicio = format(startOfMonth(hoy), 'yyyy-MM-dd')
    const fin = format(endOfMonth(hoy), 'yyyy-MM-dd')
    const fecha = format(hoy, 'yyyy-MM-dd')
    const porcentaje = parseFloat(localStorage.getItem('porcentaje') || '45')

    const [{ data: registros }, { data: gastos }, { data: dataEfectivo }] = await Promise.all([
      supabase.from('registros').select('*').gte('fecha', inicio).lte('fecha', fin),
      supabase.from('gastos').select('*').gte('fecha', inicio).lte('fecha', fin),
      supabase.from('efectivo_dia').select('*').gte('fecha', inicio).lte('fecha', fin),
    ])

    const total = (registros || []).reduce((acc, r) => acc + parseFloat(r.importe), 0)
    const totalGastos = (gastos || []).reduce((acc, g) => acc + parseFloat(g.importe), 0)
    const beneficioNeto = total - totalGastos
    const efectivoTotal = (dataEfectivo || []).reduce((acc, e) => acc + parseFloat(e.importe), 0)

    if (tipo === 'pdf') {
      exportarPDF(fecha, registros || [], gastos || [], total, totalGastos, beneficioNeto, efectivoTotal, porcentaje)
    } else {
      exportarExcel(fecha, registros || [], gastos || [], total, totalGastos, beneficioNeto, efectivoTotal, porcentaje)
    }

    toast.success('Exportado correctamente')
    setExportando(false)
    onClose()
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

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 z-50 h-full w-72 shadow-2xl"
        style={{
          backgroundColor: oscuro ? '#1f2937' : '#ffffff',
          animation: 'slideIn 0.25s ease-out',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeInUp {
            from { transform: translateY(10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        <div className="flex items-center justify-between px-5"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
            paddingBottom: '20px',
            borderBottom: `1px solid ${oscuro ? '#374151' : '#f3f4f6'}`
          }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚕</span>
            <span className="font-black text-lg" style={{ color: oscuro ? '#f9fafb' : '#111827' }}>TaxiBill</span>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl transition"
            style={{ backgroundColor: oscuro ? '#374151' : '#f3f4f6', color: oscuro ? '#9ca3af' : '#6b7280' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={() => { toggleOscuro(); onClose() }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition"
            style={{ backgroundColor: oscuro ? '#374151' : '#f9fafb', animation: 'fadeInUp 0.2s ease-out 0.05s both' }}>
            <div className="p-2 rounded-xl" style={{ backgroundColor: '#fef9c3' }}>
              {oscuro ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-yellow-500" />}
            </div>
            <div className="text-left">
              <p className="font-bold text-sm" style={{ color: oscuro ? '#f9fafb' : '#111827' }}>
                {oscuro ? 'Modo claro' : 'Modo oscuro'}
              </p>
              <p className="text-xs" style={{ color: oscuro ? '#9ca3af' : '#6b7280' }}>
                {oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              </p>
            </div>
          </button>

          <button
            onClick={handleNotificaciones}
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

          <button
            onClick={() => handleExportar('pdf')}
            disabled={exportando}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition disabled:opacity-50"
            style={{ backgroundColor: oscuro ? '#374151' : '#f9fafb', animation: 'fadeInUp 0.2s ease-out 0.15s both' }}>
            <div className="p-2 rounded-xl" style={{ backgroundColor: '#fee2e2' }}>
              <Download size={20} className="text-red-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm" style={{ color: oscuro ? '#f9fafb' : '#111827' }}>Exportar PDF</p>
              <p className="text-xs" style={{ color: oscuro ? '#9ca3af' : '#6b7280' }}>Informe del mes actual</p>
            </div>
          </button>

          <button
            onClick={() => handleExportar('excel')}
            disabled={exportando}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition disabled:opacity-50"
            style={{ backgroundColor: oscuro ? '#374151' : '#f9fafb', animation: 'fadeInUp 0.2s ease-out 0.2s both' }}>
            <div className="p-2 rounded-xl" style={{ backgroundColor: '#dcfce7' }}>
              <Download size={20} className="text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm" style={{ color: oscuro ? '#f9fafb' : '#111827' }}>Exportar Excel</p>
              <p className="text-xs" style={{ color: oscuro ? '#9ca3af' : '#6b7280' }}>Informe del mes actual</p>
            </div>
          </button>

          <div className="my-2" style={{ borderTop: `1px solid ${oscuro ? '#374151' : '#f3f4f6'}` }} />

          <button
            onClick={() => { logout(); onClose() }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition"
            style={{ backgroundColor: '#fef2f2', animation: 'fadeInUp 0.2s ease-out 0.25s both' }}>
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

  // Altura total del header = safe-area-inset-top + 16px padding top + contenido (~56px) + 16px padding bottom
  const headerHeight = 'calc(env(safe-area-inset-top) + 88px)'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
      style={{ paddingTop: headerHeight, paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
      <Toaster />

      <header
        className="bg-yellow-400 dark:bg-yellow-500 px-4 flex items-center justify-between shadow fixed top-0 left-0 right-0 z-30"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          paddingBottom: '16px'
        }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚕</span>
          <h1 className="font-black text-yellow-900 text-xl">TaxiBill</h1>
        </div>
        <button
          onClick={() => setMenuAbierto(true)}
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