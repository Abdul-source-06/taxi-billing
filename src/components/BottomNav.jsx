import { NavLink } from 'react-router-dom'
import { Car, History, BarChart2, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: Car, label: 'Hoy' },
  { to: '/historial', icon: History, label: 'Historial' },
  { to: '/estadisticas', icon: BarChart2, label: 'Stats' },
  { to: '/ajustes', icon: Settings, label: 'Ajustes' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around z-50 transition-colors duration-300"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        paddingTop: '8px'
      }}>
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition
            ${isActive ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`
          }
        >
          <Icon size={22} />
          <span className="text-xs font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}