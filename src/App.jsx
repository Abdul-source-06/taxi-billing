import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Hoy from './pages/Hoy'
import Historial from './pages/Historial'
import Estadisticas from './pages/Estadisticas'
import Ajustes from './pages/Ajustes'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-yellow-400 px-4 py-4 flex items-center gap-2 shadow">
          <span className="text-2xl">🚕</span>
          <h1 className="font-black text-yellow-900 text-xl">TaxiLog</h1>
        </header>
        <Routes>
          <Route path="/" element={<Hoy />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/ajustes" element={<Ajustes />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}