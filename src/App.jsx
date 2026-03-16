import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Moon, Sun } from 'lucide-react'
import BottomNav from './components/BottomNav'
import Hoy from './pages/Hoy'
import Historial from './pages/Historial'
import Estadisticas from './pages/Estadisticas'
import Ajustes from './pages/Ajustes'
import Login from './pages/Login'
import { useAuth } from './hooks/useAuth'
import { useModoOscuro } from './hooks/useModoOscuro'

function AppContent() {
  const { user, loading, logout } = useAuth()
  const { oscuro, toggleOscuro } = useModoOscuro()

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <span className="text-4xl animate-bounce">🚕</span>
    </div>
  )

  if (!user) return <Login />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
      <Toaster />
      <header className="bg-yellow-400 dark:bg-yellow-500 px-4 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚕</span>
          <h1 className="font-black text-yellow-900 text-xl">TaxiLog</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleOscuro} className="text-yellow-900 hover:opacity-70 transition">
            {oscuro ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={logout} className="text-yellow-900 text-sm font-semibold opacity-70 hover:opacity-100">
            Salir
          </button>
        </div>
      </header>
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