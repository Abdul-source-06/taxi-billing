import { useState } from "react";
import { useRegistros } from "../hooks/useRegistros";
import {
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Gift,
} from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import { es } from "date-fns/locale";
import toast, { Toaster } from "react-hot-toast";
import { useLocation } from "react-router-dom";

const ORIGENES = [
  { id: "taximetro", label: "Taxímetro", emoji: "🚕", logo: null },
  { id: "freenow", label: "FreeNow", emoji: null, logo: "/freenow.png" },
  { id: "uber", label: "Uber", emoji: null, logo: "/uber.png" },
];

export default function Hoy() {
  const location = useLocation();

  const [fecha, setFecha] = useState(() => {
    if (location.state?.fecha)
      return new Date(location.state.fecha + "T00:00:00");
    return new Date();
  });

  const {
    registros,
    gastos,
    loading,
    online,
    total,
    tuParte,
    porcentaje,
    totalTaximetro,
    totalFreeNow,
    totalUber,
    efectivo,
    propinas,
    añadirRegistro,
    añadirGasto,
    guardarEfectivo,
    guardarPropinas,
  } = useRegistros(fecha);

  const [pestana, setPestana] = useState("servicios");
  const [importe, setImporte] = useState("");
  const [origen, setOrigen] = useState("taximetro");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [gastoImporte, setGastoImporte] = useState("");
  const [gastoConcepto, setGastoConcepto] = useState("Gasolina");
  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [efectivoInput, setEfectivoInput] = useState("");
  const [guardandoEfectivo, setGuardandoEfectivo] = useState(false);
  const [propinaInput, setPropinaInput] = useState("");
  const [guardandoPropina, setGuardandoPropina] = useState(false);

  const esHoy = isToday(fecha);
  const fechaLabel = esHoy
    ? "Hoy"
    : format(fecha, "EEEE d 'de' MMMM", { locale: es });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!importe || isNaN(importe)) return;
    setGuardando(true);
    await añadirRegistro(importe, "servicio", notas, origen);
    toast.success("Servicio añadido");
    setImporte("");
    setNotas("");
    setGuardando(false);
  }

  async function handleGasto(e) {
    e.preventDefault();
    if (!gastoImporte || isNaN(gastoImporte)) return;
    setGuardandoGasto(true);
    await añadirGasto(gastoImporte, gastoConcepto);
    toast.success("Gasto añadido");
    setGastoImporte("");
    setGuardandoGasto(false);
  }

  async function handleEfectivo(e) {
    e.preventDefault();
    if (!efectivoInput || isNaN(efectivoInput)) return;
    setGuardandoEfectivo(true);
    const nuevoTotal = (efectivo || 0) + parseFloat(efectivoInput);
    await guardarEfectivo(nuevoTotal);
    toast.success(`Efectivo guardado — Total: ${nuevoTotal.toFixed(2)} €`);
    setEfectivoInput("");
    setGuardandoEfectivo(false);
  }

  async function handlePropina(e) {
    e.preventDefault();
    if (!propinaInput || isNaN(propinaInput)) return;
    setGuardandoPropina(true);
    const nuevoTotal = (propinas || 0) + parseFloat(propinaInput);
    await guardarPropinas(nuevoTotal);
    toast.success(`Propina guardada — Total: ${nuevoTotal.toFixed(2)} €`);
    setPropinaInput("");
    setGuardandoPropina(false);
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.25s ease-out both; }
        .press:active { transform: scale(0.97); transition: transform 0.1s ease; }
      `}</style>

      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: "14px", fontWeight: "600", fontSize: "14px" },
          duration: 2000,
        }}
      />

      {!online && (
        <div className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-semibold px-4 py-2 rounded-2xl mb-3 text-center">
          ⚡ Modo offline — Los datos se sincronizarán cuando vuelva la conexión
        </div>
      )}

      {/* Selector de fecha */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setFecha(subDays(fecha, 1))}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow text-gray-500 hover:text-yellow-500 press transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-gray-700 dark:text-gray-200 capitalize">
          {fechaLabel}
        </span>
        <button
          onClick={() => setFecha(addDays(fecha, 1))}
          disabled={esHoy}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow text-gray-500 hover:text-yellow-500 press transition-colors disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Resumen del día */}
      <div className="bg-yellow-400 rounded-3xl p-5 mb-4 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-yellow-900 text-xs font-bold uppercase tracking-widest opacity-75 mb-1">
              Total facturado
            </p>
            <p
              className="text-yellow-900 font-black"
              style={{ fontSize: "44px", lineHeight: 1 }}
            >
              {total.toFixed(2)} <span className="text-2xl">€</span>
            </p>
            <p className="text-yellow-800 text-xs mt-1 font-semibold">
              {registros.length} servicios
            </p>
          </div>
          <div className="bg-yellow-300 rounded-2xl p-3 text-right">
            <p className="text-yellow-900 text-xs font-bold">
              Tu parte ({porcentaje}%)
            </p>
            <p className="text-yellow-900 font-black text-2xl">
              {tuParte.toFixed(2)} €
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: "Taxímetro",
              valor: totalTaximetro,
              logo: null,
              emoji: "🚕",
            },
            { label: "FreeNow", valor: totalFreeNow, logo: "/freenow.png" },
            { label: "Uber", valor: totalUber, logo: "/uber.png" },
          ].map((app) => (
            <div
              key={app.label}
              className="bg-yellow-300 rounded-2xl p-3 text-center"
            >
              <div className="flex items-center justify-center mb-1.5 h-5">
                {app.logo ? (
                  <img
                    src={app.logo}
                    alt={app.label}
                    className="h-4 object-contain"
                  />
                ) : (
                  <span className="text-base">{app.emoji}</span>
                )}
              </div>
              <p className="text-yellow-900 font-black text-sm">
                {app.valor.toFixed(2)}€
              </p>
              <p className="text-yellow-800 text-xs font-medium">{app.label}</p>
            </div>
          ))}
        </div>

        {(efectivo > 0 || propinas > 0) && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* EFECTIVO */}
            <div
              className={`rounded-2xl px-3 py-2 flex items-center justify-between
    ${efectivo > 0 ? "bg-yellow-300" : "bg-yellow-200 opacity-70"}`}
            >
              <span className="text-yellow-900 text-xs font-bold">
                💵 Efectivo
              </span>

              <span
                className={`font-black text-sm
      ${efectivo > 0 ? "text-yellow-900" : "text-yellow-700"}`}
              >
                {(efectivo || 0).toFixed(2)}€
              </span>
            </div>

            {/* PROPINAS */}
            <div
              className={`rounded-2xl px-3 py-2 flex items-center justify-between
    ${propinas > 0 ? "bg-yellow-300" : "bg-yellow-200 opacity-70"}`}
            >
              <span className="text-yellow-900 text-xs font-bold">
                💲 Propinas
              </span>

              <span
                className={`font-black text-sm
      ${propinas > 0 ? "text-yellow-900" : "text-yellow-700"}`}
              >
                {(propinas || 0).toFixed(2)}€
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-1.5 mb-4 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
        {[
          {
            id: "servicios",
            label: "🚕 Servicios",
            activeClass: "bg-yellow-400 text-yellow-900",
          },
          {
            id: "efectivo",
            label: "💵 Efectivo",
            activeClass: "bg-green-500 text-white",
          },
          {
            id: "propinas",
            label: "💲 Propinas",
            activeClass: "bg-purple-500 text-white",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setPestana(tab.id)}
            className={`flex-1 py-2 rounded-xl font-semibold text-xs transition-all duration-200 press
              ${pestana === tab.id ? tab.activeClass + " shadow-sm" : "text-gray-400 dark:text-gray-500"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Servicios */}
      {pestana === "servicios" && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow space-y-4 fade-up"
        >
          <h2 className="font-bold text-gray-800 dark:text-gray-100">
            Añadir servicio
          </h2>

          <div className="flex gap-2">
            {ORIGENES.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOrigen(o.id)}
                className={`flex-1 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 press
                  ${origen === o.id ? "bg-yellow-400 text-yellow-900 shadow-sm" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}
              >
                {o.logo ? (
                  <img
                    src={o.logo}
                    alt={o.label}
                    className="h-4 object-contain"
                  />
                ) : (
                  <span>{o.emoji}</span>
                )}
                <span>{o.label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center border-b-2 border-gray-200 dark:border-gray-600 focus-within:border-yellow-400 pb-2 transition-colors">
            <span className="text-2xl font-bold text-gray-300 dark:text-gray-500">
              €
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              className="flex-1 text-3xl font-black outline-none bg-transparent dark:text-white text-gray-800 placeholder-gray-300"
            />
          </div>

          <input
            type="text"
            placeholder="Notas (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-yellow-400 bg-transparent dark:text-white dark:placeholder-gray-500 transition-colors"
          />

          <button
            type="submit"
            disabled={guardando || !importe}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-yellow-900 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors press shadow-sm"
          >
            <PlusCircle size={20} />
            {guardando ? "Guardando..." : "Añadir"}
          </button>
        </form>
      )}

      {/* Efectivo */}
      {pestana === "efectivo" && (
        <form
          onSubmit={handleEfectivo}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow space-y-4 fade-up"
        >
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900 p-2.5 rounded-2xl">
              <Wallet size={20} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">
                Efectivo recaudado
              </h3>
              <p className="text-xs text-gray-400">
                Anota el total cobrado durante el día
              </p>
            </div>
          </div>

          {efectivo > 0 && (
            <div className="bg-green-50 dark:bg-green-900 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-green-700 dark:text-green-300 text-sm font-semibold">
                Total acumulado
              </span>
              <span className="text-green-700 dark:text-green-300 font-black text-xl">
                {efectivo.toFixed(2)} €
              </span>
            </div>
          )}

          <div className="flex gap-3 items-center border-b-2 border-gray-200 dark:border-gray-600 focus-within:border-green-400 pb-2 transition-colors">
            <span className="text-2xl font-bold text-gray-300 dark:text-gray-500">
              €
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={efectivoInput}
              onChange={(e) => setEfectivoInput(e.target.value)}
              className="flex-1 text-3xl font-black outline-none bg-transparent dark:text-white text-gray-800 placeholder-gray-300"
            />
          </div>

          <button
            type="submit"
            disabled={guardandoEfectivo}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-2xl transition-colors press disabled:opacity-50 shadow-sm"
          >
            {guardandoEfectivo ? "Guardando..." : "Guardar efectivo"}
          </button>
        </form>
      )}

      {/* Propinas */}
      {pestana === "propinas" && (
        <form
          onSubmit={handlePropina}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow space-y-4 fade-up"
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900 p-2.5 rounded-2xl">
              <Gift size={20} className="text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">
                Propinas del día
              </h3>
              <p className="text-xs text-gray-400">
                Añade las propinas recibidas durante el día
              </p>
            </div>
          </div>

          {propinas > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-purple-700 dark:text-purple-300 text-sm font-semibold">
                Total acumulado
              </span>
              <span className="text-purple-700 dark:text-purple-300 font-black text-xl">
                {propinas.toFixed(2)} €
              </span>
            </div>
          )}

          <div className="flex gap-3 items-center border-b-2 border-gray-200 dark:border-gray-600 focus-within:border-purple-400 pb-2 transition-colors">
            <span className="text-2xl font-bold text-gray-300 dark:text-gray-500">
              €
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={propinaInput}
              onChange={(e) => setPropinaInput(e.target.value)}
              className="flex-1 text-3xl font-black outline-none bg-transparent dark:text-white text-gray-800 placeholder-gray-300"
            />
          </div>

          <button
            type="submit"
            disabled={guardandoPropina}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3.5 rounded-2xl transition-colors press disabled:opacity-50 shadow-sm"
          >
            {guardandoPropina ? "Guardando..." : "Guardar propina"}
          </button>
        </form>
      )}
    </div>
  );
}
