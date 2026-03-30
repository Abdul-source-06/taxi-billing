import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import {
  getRegistrosLocal,
  guardarRegistroLocal,
  eliminarRegistroLocal,
  getGastosLocal,
  guardarGastoLocal,
  eliminarGastoLocal,
  añadirPendiente,
} from "../lib/db";
import { sincronizar } from "../lib/sync";

export function useRegistros(fecha = new Date()) {
  const [registros, setRegistros] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [efectivo, setEfectivo] = useState(0);
  const [propinas, setPropinas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const fechaStr = format(fecha, "yyyy-MM-dd");
  const porcentaje = parseFloat(localStorage.getItem("porcentaje") || "45");

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      sincronizar().then(() => cargarTodo());
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [fechaStr]);

  async function cargarTodo() {
    setLoading(true);
    setEfectivo(0);
    setPropinas(0);
    if (navigator.onLine) {
      try {
        const [
          { data: dataRegistros },
          { data: dataGastos },
          { data: dataEfectivo },
          { data: dataPropinas },
        ] = await Promise.all([
          supabase.from("registros").select("*").eq("fecha", fechaStr).order("hora", { ascending: false }),
          supabase.from("gastos").select("*").eq("fecha", fechaStr).order("hora", { ascending: false }),
          supabase.from("efectivo_dia").select("*").eq("fecha", fechaStr).limit(1),
          supabase.from("propinas_dia").select("*").eq("fecha", fechaStr).limit(1),
        ]);
        const regs = dataRegistros || [];
        const gasts = dataGastos || [];
        await Promise.all(regs.map((r) => guardarRegistroLocal(r)));
        await Promise.all(gasts.map((g) => guardarGastoLocal(g)));
        setRegistros(regs);
        setGastos(gasts);
        setEfectivo(dataEfectivo?.[0]?.importe || 0);
        setPropinas(dataPropinas?.[0]?.importe || 0);
      } catch {
        const regs = await getRegistrosLocal(fechaStr);
        const gasts = await getGastosLocal(fechaStr);
        setRegistros(regs);
        setGastos(gasts);
      }
    } else {
      const regs = await getRegistrosLocal(fechaStr);
      const gasts = await getGastosLocal(fechaStr);
      setRegistros(regs.sort((a, b) => b.hora.localeCompare(a.hora)));
      setGastos(gasts.sort((a, b) => b.hora.localeCompare(a.hora)));
    }
    setLoading(false);
  }

  async function guardarEfectivo(importe) {
    setEfectivo(importe);
    if (navigator.onLine) {
      await supabase
        .from("efectivo_dia")
        .upsert({ fecha: fechaStr, importe: parseFloat(importe) }, { onConflict: "fecha" });
    }
  }

  async function guardarPropinas(importe) {
    setPropinas(importe);
    if (navigator.onLine) {
      await supabase
        .from("propinas_dia")
        .upsert({ fecha: fechaStr, importe: parseFloat(importe) }, { onConflict: "fecha" });
    }
  }

  async function añadirRegistro(importe, tipo, notas = "", origen = "taximetro") {
    const ahora = new Date();
    const existente = registros.find((r) => r.origen === origen);

    if (existente) {
      const nuevoTotal = parseFloat(existente.importe) + parseFloat(importe);
      const registroActualizado = { ...existente, importe: nuevoTotal };
      await guardarRegistroLocal(registroActualizado);
      setRegistros((prev) => prev.map((r) => (r.id === existente.id ? registroActualizado : r)));
      if (navigator.onLine) {
        await supabase.from("registros").update({ importe: nuevoTotal }).eq("id", existente.id);
      } else {
        await añadirPendiente({
          tipo: "editar_registro",
          datos: { id: existente.id, importe: nuevoTotal, tipo: existente.tipo, notas: existente.notas, origen },
        });
      }
    } else {
      const nuevoRegistro = {
        id: crypto.randomUUID(),
        fecha: fechaStr,
        hora: format(ahora, "HH:mm:ss"),
        importe: parseFloat(importe),
        tipo,
        notas,
        origen,
        created_at: new Date().toISOString(),
      };
      await guardarRegistroLocal(nuevoRegistro);
      setRegistros((prev) => [nuevoRegistro, ...prev]);
      if (navigator.onLine) {
        const { data } = await supabase.from("registros").insert([nuevoRegistro]).select();
        if (data) {
          await guardarRegistroLocal(data[0]);
          setRegistros((prev) => prev.map((r) => (r.id === nuevoRegistro.id ? data[0] : r)));
        }
      } else {
        await añadirPendiente({ tipo: "insertar_registro", datos: nuevoRegistro });
      }
    }
  }

  async function editarRegistro(id, importe, tipo, notas, origen) {
    const registroActualizado = {
      ...registros.find((r) => r.id === id),
      importe: parseFloat(importe),
      tipo,
      notas,
      origen,
    };
    await guardarRegistroLocal(registroActualizado);
    setRegistros((prev) => prev.map((r) => (r.id === id ? registroActualizado : r)));
    if (navigator.onLine) {
      await supabase.from("registros").update({ importe: parseFloat(importe), tipo, notas, origen }).eq("id", id);
    } else {
      await añadirPendiente({ tipo: "editar_registro", datos: { id, importe, tipo, notas, origen } });
    }
  }

  async function eliminarRegistro(id) {
    await eliminarRegistroLocal(id);
    setRegistros((prev) => prev.filter((r) => r.id !== id));
    if (navigator.onLine) {
      await supabase.from("registros").delete().eq("id", id);
    } else {
      await añadirPendiente({ tipo: "eliminar_registro", datos: { id } });
    }
  }

  async function añadirGasto(importe, concepto) {
    const ahora = new Date();
    const nuevoGasto = {
      id: crypto.randomUUID(),
      fecha: fechaStr,
      hora: format(ahora, "HH:mm:ss"),
      importe: parseFloat(importe),
      concepto,
      created_at: new Date().toISOString(),
    };
    await guardarGastoLocal(nuevoGasto);
    setGastos((prev) => [nuevoGasto, ...prev]);
    if (navigator.onLine) {
      const { data } = await supabase.from("gastos").insert([nuevoGasto]).select();
      if (data) {
        await guardarGastoLocal(data[0]);
        setGastos((prev) => prev.map((g) => (g.id === nuevoGasto.id ? data[0] : g)));
      }
    } else {
      await añadirPendiente({ tipo: "insertar_gasto", datos: nuevoGasto });
    }
  }

  async function eliminarGasto(id) {
    await eliminarGastoLocal(id);
    setGastos((prev) => prev.filter((g) => g.id !== id));
    if (navigator.onLine) {
      await supabase.from("gastos").delete().eq("id", id);
    } else {
      await añadirPendiente({ tipo: "eliminar_gasto", datos: { id } });
    }
  }

  const totalIngresos = registros.reduce((acc, r) => acc + parseFloat(r.importe), 0);
  const totalGastos = gastos.reduce((acc, g) => acc + parseFloat(g.importe), 0);
  const beneficioNeto = totalIngresos - totalGastos;
  const tuParte = totalIngresos * (porcentaje / 100);
  const totalTaximetro = registros.filter((r) => r.origen === "taximetro").reduce((acc, r) => acc + parseFloat(r.importe), 0);
  const totalFreeNow = registros.filter((r) => r.origen === "freenow").reduce((acc, r) => acc + parseFloat(r.importe), 0);
  const totalUber = registros.filter((r) => r.origen === "uber").reduce((acc, r) => acc + parseFloat(r.importe), 0);

  return {
    registros, gastos, loading, online,
    total: totalIngresos, totalGastos, beneficioNeto,
    tuParte, porcentaje, efectivo, propinas,
    totalTaximetro, totalFreeNow, totalUber,
    añadirRegistro, editarRegistro, eliminarRegistro,
    añadirGasto, eliminarGasto,
    guardarEfectivo, guardarPropinas,
  };
}