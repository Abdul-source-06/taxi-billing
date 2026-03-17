import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useModoOscuro } from "../hooks/useModoOscuro";
import { Moon, Sun, Bell, Target, User, ChevronRight, Check } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function Ajustes() {
  const { user, logout } = useAuth();
  const { oscuro, toggleOscuro } = useModoOscuro();

  const [objetivo, setObjetivo] = useState(() => localStorage.getItem("objetivoDiario") || "");
  const [editandoObjetivo, setEditandoObjetivo] = useState(false);
  const [notificaciones, setNotificaciones] = useState(() => localStorage.getItem("notificaciones") === "true");
  const [porcentajeVal, setPorcentajeVal] = useState(() => localStorage.getItem('porcentaje') || '45')

  function guardarPorcentaje() {
    localStorage.setItem('porcentaje', porcentajeVal)
    toast.success('Porcentaje guardado')
  }

  function guardarObjetivo() {
    localStorage.setItem("objetivoDiario", objetivo);
    setEditandoObjetivo(false);
    toast.success("Objetivo guardado");
  }

  async function toggleNotificaciones() {
    if (!notificaciones) {
      const permiso = await Notification.requestPermission();
      if (permiso === "granted") {
        setNotificaciones(true);
        localStorage.setItem("notificaciones", "true");
        toast.success("Notificaciones activadas");
      } else {
        toast.error("Permiso denegado");
      }
    } else {
      setNotificaciones(false);
      localStorage.setItem("notificaciones", "false");
      toast.success("Notificaciones desactivadas");
    }
  }

  function enviarNotificacionPrueba() {
    if (Notification.permission === "granted") {
      new Notification("🚕 TaxiLog", {
        body: "Las notificaciones funcionan correctamente",
        icon: "/taxi.png",
      });
    } else {
      toast.error("Activa las notificaciones primero");
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <Toaster />
      <h2 className="font-bold text-gray-800 dark:text-gray-100 text-xl">Ajustes</h2>

      {/* Cuenta */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cuenta</p>
        </div>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-xl">
            <User size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{user?.email}</p>
            <p className="text-xs text-gray-400">Usuario activo</p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <button onClick={logout}
            className="w-full bg-red-50 dark:bg-red-900 hover:bg-red-100 text-red-500 dark:text-red-300 font-semibold py-2 rounded-xl text-sm transition">
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Apariencia */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Apariencia</p>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-xl">
              {oscuro ? <Moon size={20} className="text-gray-600 dark:text-gray-300" /> : <Sun size={20} className="text-yellow-500" />}
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Modo oscuro</p>
              <p className="text-xs text-gray-400">{oscuro ? "Activado" : "Desactivado"}</p>
            </div>
          </div>
          <button onClick={toggleOscuro}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${oscuro ? "bg-yellow-400" : "bg-gray-200"}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${oscuro ? "translate-x-7" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      {/* Porcentaje */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mi porcentaje</p>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-xl">
              <span className="text-yellow-600 font-black text-sm">%</span>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Porcentaje que te llevas</p>
              <p className="text-xs text-gray-400">Se aplica al total facturado del día</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="number" min="1" max="100" value={porcentajeVal}
              onChange={e => setPorcentajeVal(e.target.value)}
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl p-2 text-sm outline-none focus:border-yellow-400 bg-transparent dark:text-white"
              placeholder="45" />
            <button onClick={guardarPorcentaje}
              className="bg-yellow-400 text-yellow-900 font-bold px-4 rounded-xl flex items-center gap-1 text-sm">
              <Check size={16} /> Guardar
            </button>
          </div>
        </div>
      </div>

      {/* Objetivo diario */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Objetivo diario</p>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-xl">
              <Target size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Meta de facturación</p>
              <p className="text-xs text-gray-400">Recibe una notificación al alcanzarlo</p>
            </div>
          </div>
          {editandoObjetivo ? (
            <div className="flex gap-2">
              <input type="number" value={objetivo} onChange={e => setObjetivo(e.target.value)}
                placeholder="Ej: 200"
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl p-2 text-sm outline-none focus:border-yellow-400 bg-transparent dark:text-white" />
              <button onClick={guardarObjetivo}
                className="bg-yellow-400 text-yellow-900 font-bold px-4 rounded-xl flex items-center gap-1 text-sm">
                <Check size={16} /> Guardar
              </button>
            </div>
          ) : (
            <button onClick={() => setEditandoObjetivo(true)}
              className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2">
              <span className="text-gray-700 dark:text-gray-200 font-semibold">
                {objetivo ? `${objetivo} €` : "Sin objetivo definido"}
              </span>
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Notificaciones */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notificaciones</p>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-xl">
              <Bell size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Resumen diario</p>
              <p className="text-xs text-gray-400">Notificación al final del día</p>
            </div>
          </div>
          <button onClick={toggleNotificaciones}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${notificaciones ? "bg-yellow-400" : "bg-gray-200"}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${notificaciones ? "translate-x-7" : "translate-x-1"}`} />
          </button>
        </div>
        {notificaciones && (
          <div className="px-4 pb-3">
            <button onClick={enviarNotificacionPrueba}
              className="w-full bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 text-blue-600 dark:text-blue-300 font-semibold py-2 rounded-xl text-sm transition">
              Enviar notificación de prueba
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-300 dark:text-gray-600 pb-2">TaxiLog v1.0.0</p>
    </div>
  );
}