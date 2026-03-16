import { useState } from 'react'
import { Download, FileText, Table } from 'lucide-react'
import { exportarPDF, exportarExcel } from '../lib/exportar'
import { format } from 'date-fns'

export default function BotonExportar({ fecha, registros, gastos, total, totalGastos, beneficioNeto }) {
  const [abierto, setAbierto] = useState(false)
  const fechaStr = format(fecha, 'yyyy-MM-dd')

  function handlePDF() {
    exportarPDF(fechaStr, registros, gastos, total, totalGastos, beneficioNeto)
    setAbierto(false)
  }

  function handleExcel() {
    exportarExcel(fechaStr, registros, gastos, total, totalGastos, beneficioNeto)
    setAbierto(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-1 bg-white shadow px-3 py-2 rounded-xl text-gray-600 hover:text-yellow-500 font-semibold text-sm transition"
      >
        <Download size={16} />
        Exportar
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-xl z-20 overflow-hidden w-44">
            <button
              onClick={handlePDF}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 text-gray-700 font-semibold text-sm transition"
            >
              <FileText size={18} className="text-red-500" />
              Exportar PDF
            </button>
            <button
              onClick={handleExcel}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 text-gray-700 font-semibold text-sm transition"
            >
              <Table size={18} className="text-green-600" />
              Exportar Excel
            </button>
          </div>
        </>
      )}
    </div>
  )
}