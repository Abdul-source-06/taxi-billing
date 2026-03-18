import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingUp,
  Calendar,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function GraficaBarras({ datos, color = "#facc15" }) {
  const maxValor = Math.max(...datos.map((d) => d.total), 1);
  return (
    <div className="w-full">
      <div className="flex items-end gap-1 w-full" style={{ height: "160px" }}>
        {datos.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end"
            style={{ height: "100%" }}
          >
            {d.total > 0 && (
              <span style={{ fontSize: "9px" }} className="text-gray-400 mb-1">
                {d.total.toFixed(0)}€
              </span>
            )}
            <div
              style={{
                width: "100%",
                height: `${Math.max((d.total / maxValor) * 130, d.total > 0 ? 4 : 0)}px`,
                backgroundColor: color,
                borderRadius: "6px 6px 0 0",
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 w-full mt-1">
        {datos.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span
              style={{ fontSize: "10px" }}
              className="text-gray-400 capitalize"
            >
              {d.nombre}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Estadisticas() {
  const [vistaGrafica, setVistaGrafica] = useState("semana");
  const [fechaRef, setFechaRef] = useState(new Date());

  const [stats, setStats] = useState({ total: 0, servicios: 0 });
  const [mejorDia, setMejorDia] = useState(null);
  const [mediaDiaria, setMediaDiaria] = useState(0);
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [origenes, setOrigenes] = useState({
    taximetro: 0,
    freenow: 0,
    uber: 0,
  });
  const [tuParte, setTuParte] = useState(0);
  const [totalEfectivo, setTotalEfectivo] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, [vistaGrafica, fechaRef]);

  async function cargarEstadisticas() {
    setLoading(true);
    const porcentaje = parseFloat(localStorage.getItem("porcentaje") || "45");

    let inicio, fin, labelFn, intervaloDias;

    if (vistaGrafica === "semana") {
      inicio = startOfWeek(fechaRef, { weekStartsOn: 1 });
      fin = endOfWeek(fechaRef, { weekStartsOn: 1 });
      labelFn = (dia) => format(dia, "EEE", { locale: es });
    } else {
      inicio = startOfMonth(fechaRef);
      fin = endOfMonth(fechaRef);
      labelFn = (dia) => format(dia, "d");
    }

    const inicioStr = format(inicio, "yyyy-MM-dd");
    const finStr = format(fin, "yyyy-MM-dd");

    const [{ data }, { data: dataEfectivo }] = await Promise.all([
      supabase
        .from("registros")
        .select("fecha, importe, origen")
        .gte("fecha", inicioStr)
        .lte("fecha", finStr),
      supabase
        .from("efectivo_dia")
        .select("importe")
        .gte("fecha", inicioStr)
        .lte("fecha", finStr),
    ]);

    const totalEfectivoP = (dataEfectivo || []).reduce(
      (acc, e) => acc + parseFloat(e.importe),
      0,
    );
    setTotalEfectivo(totalEfectivoP);

    if (data) {
      const total = data.reduce((acc, r) => acc + parseFloat(r.importe), 0);

      const totalTaximetro = data
        .filter((r) => r.origen === "taximetro" || !r.origen)
        .reduce((acc, r) => acc + parseFloat(r.importe), 0);
      const totalFreeNow = data
        .filter((r) => r.origen === "freenow")
        .reduce((acc, r) => acc + parseFloat(r.importe), 0);
      const totalUber = data
        .filter((r) => r.origen === "uber")
        .reduce((acc, r) => acc + parseFloat(r.importe), 0);

      setOrigenes({
        taximetro: totalTaximetro,
        freenow: totalFreeNow,
        uber: totalUber,
      });
      setTuParte(total * (porcentaje / 100));
      setStats({ total, servicios: data.length });

      const porDia = data.reduce((acc, r) => {
        if (!acc[r.fecha]) acc[r.fecha] = 0;
        acc[r.fecha] += parseFloat(r.importe);
        return acc;
      }, {});

      const diasOrdenados = Object.entries(porDia).sort((a, b) => b[1] - a[1]);
      if (diasOrdenados.length > 0) {
        setMejorDia({ fecha: diasOrdenados[0][0], total: diasOrdenados[0][1] });
      } else {
        setMejorDia(null);
      }

      const numDias = Object.keys(porDia).length;
      setMediaDiaria(numDias > 0 ? total / numDias : 0);

      intervaloDias = eachDayOfInterval({ start: inicio, end: fin });
      setDatosGrafica(
        intervaloDias.map((dia) => ({
          nombre: labelFn(dia),
          total: porDia[format(dia, "yyyy-MM-dd")] || 0,
        })),
      );
    }
    setLoading(false);
  }

  function anterior() {
    if (vistaGrafica === "semana") setFechaRef(subWeeks(fechaRef, 1));
    else setFechaRef(subMonths(fechaRef, 1));
  }

  function siguiente() {
    if (vistaGrafica === "semana") setFechaRef(addWeeks(fechaRef, 1));
    else setFechaRef(addMonths(fechaRef, 1));
  }

  const esActual =
    vistaGrafica === "semana"
      ? format(startOfWeek(fechaRef, { weekStartsOn: 1 }), "yyyy-MM-dd") ===
        format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
      : format(fechaRef, "yyyy-MM") === format(new Date(), "yyyy-MM");

  const labelPeriodo =
    vistaGrafica === "semana"
      ? `${format(startOfWeek(fechaRef, { weekStartsOn: 1 }), "d MMM", { locale: es })} – ${format(endOfWeek(fechaRef, { weekStartsOn: 1 }), "d MMM", { locale: es })}`
      : format(fechaRef, "MMMM yyyy", { locale: es });

  const porcentaje = parseFloat(localStorage.getItem("porcentaje") || "45");
  const totalMes = origenes.taximetro + origenes.freenow + origenes.uber;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="font-bold text-gray-800 dark:text-gray-100 text-xl flex items-center gap-2">
        <BarChart2 size={22} /> Estadísticas
      </h2>

      {/* Selector de periodo */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-3">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-3">
          <button
            onClick={() => {
              setVistaGrafica("semana");
              setFechaRef(new Date());
            }}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition
              ${vistaGrafica === "semana" ? "bg-yellow-400 text-yellow-900" : "text-gray-500 dark:text-gray-400"}`}
          >
            Semana
          </button>
          <button
            onClick={() => {
              setVistaGrafica("mes");
              setFechaRef(new Date());
            }}
            className={`flex-1 py-1 rounded-lg text-xs font-semibold transition
              ${vistaGrafica === "mes" ? "bg-yellow-400 text-yellow-900" : "text-gray-500 dark:text-gray-400"}`}
          >
            Mes
          </button>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={anterior}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-yellow-500"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-bold text-gray-700 dark:text-gray-200 capitalize text-sm">
            {labelPeriodo}
          </span>
          <button
            onClick={siguiente}
            disabled={esActual}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-yellow-500 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Cargando...</p>
      ) : (
        <>
          {/* Resumen del periodo */}
          <div className="bg-yellow-400 rounded-2xl p-4 shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-yellow-900 text-xs font-semibold uppercase tracking-wide">
                  Total {vistaGrafica === "semana" ? "esta semana" : "este mes"}
                </p>
                <p className="text-yellow-900 font-black text-3xl">
                  {stats.total.toFixed(2)} €
                </p>
                <p className="text-yellow-800 text-xs">
                  {stats.servicios} servicios
                </p>
              </div>
              <div className="bg-yellow-300 rounded-xl p-3 text-right">
                <p className="text-yellow-900 text-xs font-semibold">
                  Tu parte ({porcentaje}%)
                </p>
                <p className="text-yellow-900 font-black text-2xl">
                  {tuParte.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>

          {/* Efectivo */}
          <div className="bg-green-50 dark:bg-green-900 rounded-2xl p-4 shadow">
            <p className="text-green-700 dark:text-green-300 text-xs font-semibold uppercase tracking-wide">
              💵 Efectivo recaudado
            </p>
            <p className="text-green-700 dark:text-green-300 font-black text-3xl mt-1">
              {totalEfectivo.toFixed(2)} €
            </p>
          </div>

          {/* Lo que te debe la empresa — solo en mes */}
          {/* Lo que te debe la empresa — solo en mes */}
          {vistaGrafica === "mes" && (
            <div className="bg-blue-50 dark:bg-blue-900 rounded-2xl p-4 shadow">
              <p className="text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wide">
                🏦 Pendiente de cobro
              </p>
              <p className="text-blue-700 dark:text-blue-300 font-black text-3xl mt-1">
                {(tuParte - totalEfectivo).toFixed(2)} €
              </p>
              <p className="text-blue-500 dark:text-blue-400 text-xs mt-1">
                Tu parte {tuParte.toFixed(2)}€ − efectivo{" "}
                {totalEfectivo.toFixed(2)}€
              </p>
            </div>
          )}

          {/* Desglose por origen */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3">
              Desglose por app
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: "🚕 Taxímetro",
                  valor: origenes.taximetro,
                  color: "bg-yellow-400",
                },
                {
                  label: "🔴 FreeNow",
                  valor: origenes.freenow,
                  color: "bg-red-500",
                },
                {
                  label: "⚫ Uber",
                  valor: origenes.uber,
                  color: "bg-gray-800 dark:bg-gray-400",
                },
              ].map((o) => (
                <div key={o.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {o.label}
                    </span>
                    <span className="font-black text-gray-800 dark:text-white">
                      {o.valor.toFixed(2)} €
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`${o.color} h-2 rounded-full transition-all duration-500`}
                      style={{
                        width:
                          totalMes > 0
                            ? `${(o.valor / totalMes) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {totalMes > 0 ? ((o.valor / totalMes) * 100).toFixed(1) : 0}
                    % del total
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfica */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4">
              Facturación por día
            </h3>
            <GraficaBarras datos={datosGrafica} />
          </div>

          {/* Media diaria */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow flex items-center gap-3">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-xl">
              <TrendingUp
                size={20}
                className="text-yellow-600 dark:text-yellow-400"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Media diaria
              </p>
              <p className="font-black text-gray-800 dark:text-white text-2xl">
                {mediaDiaria.toFixed(2)} €
              </p>
              <p className="text-xs text-gray-400">
                Tu parte:{" "}
                <span className="font-bold text-yellow-500">
                  {((mediaDiaria * porcentaje) / 100).toFixed(2)} €
                </span>
              </p>
            </div>
          </div>

          {/* Mejor día */}
          {mejorDia && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-xl">
                <Calendar
                  size={20}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Mejor día
                </p>
                <p className="font-bold text-gray-800 dark:text-white capitalize">
                  {format(
                    new Date(mejorDia.fecha + "T00:00:00"),
                    "EEEE d 'de' MMMM",
                    { locale: es },
                  )}
                </p>
                <p className="font-black text-green-500 text-xl">
                  {mejorDia.total.toFixed(2)} €
                </p>
                <p className="text-xs text-gray-400">
                  Tu parte:{" "}
                  <span className="font-bold text-yellow-500">
                    {((mejorDia.total * porcentaje) / 100).toFixed(2)} €
                  </span>
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
