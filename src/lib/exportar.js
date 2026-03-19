import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

function agruparDatos(registros, gastos, efectivo, fechas) {
  const porFecha = registros.reduce((acc, r) => {
    if (!acc[r.fecha]) acc[r.fecha] = { taximetro: 0, freenow: 0, uber: 0, total: 0 }
    const imp = parseFloat(r.importe)
    acc[r.fecha].total += imp
    if (r.origen === 'freenow') acc[r.fecha].freenow += imp
    else if (r.origen === 'uber') acc[r.fecha].uber += imp
    else acc[r.fecha].taximetro += imp
    return acc
  }, {})

  const gastosPorFecha = gastos.reduce((acc, g) => {
    if (!acc[g.fecha]) acc[g.fecha] = 0
    acc[g.fecha] += parseFloat(g.importe)
    return acc
  }, {})

  return { porFecha, gastosPorFecha, fechas: fechas || Object.keys(porFecha).sort() }
}

function tablaBody(porFecha, gastosPorFecha, fechas, efectivo) {
  return fechas.map(f => [
    format(new Date(f + 'T00:00:00'), "EEE d MMM", { locale: es }),
    `${(porFecha[f]?.taximetro || 0).toFixed(2)} €`,
    `${(porFecha[f]?.freenow || 0).toFixed(2)} €`,
    `${(porFecha[f]?.uber || 0).toFixed(2)} €`,
    `${(porFecha[f]?.total || 0).toFixed(2)} €`,
    `${(efectivo / Math.max(fechas.length, 1)).toFixed(2)} €`,
    `${(gastosPorFecha[f] || 0).toFixed(2)} €`,
  ])
}

function tablaFoot(registros, total, efectivo, totalGastos) {
  return [[
    'TOTAL',
    `${registros.filter(r => r.origen === 'taximetro' || !r.origen).reduce((a, r) => a + parseFloat(r.importe), 0).toFixed(2)} €`,
    `${registros.filter(r => r.origen === 'freenow').reduce((a, r) => a + parseFloat(r.importe), 0).toFixed(2)} €`,
    `${registros.filter(r => r.origen === 'uber').reduce((a, r) => a + parseFloat(r.importe), 0).toFixed(2)} €`,
    `${total.toFixed(2)} €`,
    `${efectivo.toFixed(2)} €`,
    `${totalGastos.toFixed(2)} €`,
  ]]
}

function resumenFinal(total, efectivo, totalGastos, porcentaje) {
  return [
    ['Total facturado', `${total.toFixed(2)} €`],
    ['Efectivo recaudado', `${efectivo.toFixed(2)} €`],
    ['Total gastos', `${totalGastos.toFixed(2)} €`],
    [`Mi parte (${porcentaje}%)`, `${(total * (porcentaje / 100)).toFixed(2)} €`],
    ['Pendiente de cobro', `${((total * (porcentaje / 100)) - efectivo).toFixed(2)} €`],
  ]
}

const estiloTabla = {
  headStyles: { fillColor: [250, 204, 21], textColor: [120, 80, 0], fontStyle: 'bold', fontSize: 8 },
  bodyStyles: { textColor: [40, 40, 40], fontSize: 8 },
  footStyles: { fillColor: [250, 204, 21], textColor: [120, 80, 0], fontStyle: 'bold', fontSize: 8 },
  alternateRowStyles: { fillColor: [255, 251, 235] },
  columnStyles: {
    0: { halign: 'left', cellWidth: 22 },
    1: { halign: 'right', cellWidth: 27 },
    2: { halign: 'right', cellWidth: 27 },
    3: { halign: 'right', cellWidth: 27 },
    4: { halign: 'right', fontStyle: 'bold', cellWidth: 27 },
    5: { halign: 'right', cellWidth: 27 },
    6: { halign: 'right', cellWidth: 27 },
  },
  margin: { left: 7, right: 7 },
}

// ─── PDF MENSUAL ───────────────────────────────────────────
export function exportarPDF(fecha, registros, gastos, total, totalGastos, beneficioNeto, efectivo = 0, porcentaje = 45) {
  const doc = new jsPDF()
  const labelPeriodo = `Informe del mes — ${format(new Date(fecha + 'T00:00:00'), "MMMM yyyy", { locale: es })}`

  doc.setFillColor(250, 204, 21)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(120, 80, 0)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('TaxiBill', 14, 15)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(labelPeriodo, 14, 26)

  doc.setTextColor(40, 40, 40)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen del mes', 14, 48)

  const { porFecha, gastosPorFecha, fechas } = agruparDatos(registros, gastos, efectivo)

  autoTable(doc, {
    startY: 52,
    head: [['Fecha', 'Taxímetro', 'FreeNow', 'Uber', 'Total día', 'Efectivo', 'Gastos']],
    body: tablaBody(porFecha, gastosPorFecha, fechas, efectivo),
    foot: tablaFoot(registros, total, efectivo, totalGastos),
    ...estiloTabla,
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Concepto', 'Importe']],
    body: resumenFinal(total, efectivo, totalGastos, porcentaje),
    headStyles: { fillColor: [250, 204, 21], textColor: [120, 80, 0], fontStyle: 'bold' },
    bodyStyles: { textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generado por TaxiBill · ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 285)
  doc.save(`taxibill_${format(new Date(fecha + 'T00:00:00'), 'yyyy-MM')}.pdf`)
}

// ─── PDF SEMANAL ───────────────────────────────────────────
export function exportarPDFSemana(fechaRef, registros, gastos, total, totalGastos, beneficioNeto, efectivo = 0, porcentaje = 45) {
  const doc = new jsPDF()
  const inicio = startOfWeek(new Date(fechaRef + 'T00:00:00'), { weekStartsOn: 1 })
  const fin = endOfWeek(new Date(fechaRef + 'T00:00:00'), { weekStartsOn: 1 })
  const labelPeriodo = `Semana del ${format(inicio, "d MMM", { locale: es })} al ${format(fin, "d MMM yyyy", { locale: es })}`

  doc.setFillColor(250, 204, 21)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(120, 80, 0)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('TaxiBill', 14, 15)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(labelPeriodo, 14, 26)

  doc.setTextColor(40, 40, 40)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen de la semana', 14, 48)

  const { porFecha, gastosPorFecha, fechas } = agruparDatos(registros, gastos, efectivo)

  autoTable(doc, {
    startY: 52,
    head: [['Fecha', 'Taxímetro', 'FreeNow', 'Uber', 'Total día', 'Efectivo', 'Gastos']],
    body: tablaBody(porFecha, gastosPorFecha, fechas, efectivo),
    foot: tablaFoot(registros, total, efectivo, totalGastos),
    ...estiloTabla,
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Concepto', 'Importe']],
    body: resumenFinal(total, efectivo, totalGastos, porcentaje),
    headStyles: { fillColor: [250, 204, 21], textColor: [120, 80, 0], fontStyle: 'bold' },
    bodyStyles: { textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generado por TaxiBill · ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 285)
  doc.save(`taxibill_semana_${fechaRef}.pdf`)
}

// ─── EXCEL MENSUAL ─────────────────────────────────────────
export function exportarExcel(fecha, registros, gastos, total, totalGastos, beneficioNeto, efectivo = 0, porcentaje = 45) {
  const wb = XLSX.utils.book_new()
  const mesStr = format(new Date(fecha + 'T00:00:00'), "MMMM yyyy", { locale: es })
  const { porFecha, gastosPorFecha, fechas } = agruparDatos(registros, gastos, efectivo)

  const data = [
    [`TaxiBill — Informe ${mesStr}`],
    [],
    ['Fecha', 'Taxímetro (€)', 'FreeNow (€)', 'Uber (€)', 'Total día (€)', 'Efectivo (€)', 'Gastos (€)'],
    ...fechas.map(f => [
      format(new Date(f + 'T00:00:00'), "EEE d MMM", { locale: es }),
      porFecha[f]?.taximetro || 0,
      porFecha[f]?.freenow || 0,
      porFecha[f]?.uber || 0,
      porFecha[f]?.total || 0,
      parseFloat((efectivo / Math.max(fechas.length, 1)).toFixed(2)),
      gastosPorFecha[f] || 0,
    ]),
    [],
    ['TOTAL',
      registros.filter(r => r.origen === 'taximetro' || !r.origen).reduce((a, r) => a + parseFloat(r.importe), 0),
      registros.filter(r => r.origen === 'freenow').reduce((a, r) => a + parseFloat(r.importe), 0),
      registros.filter(r => r.origen === 'uber').reduce((a, r) => a + parseFloat(r.importe), 0),
      total, efectivo, totalGastos,
    ],
    [],
    ['Resumen', ''],
    ['Total facturado', total],
    ['Efectivo recaudado', efectivo],
    ['Total gastos', totalGastos],
    [`Mi parte (${porcentaje}%)`, total * (porcentaje / 100)],
    ['Pendiente de cobro', (total * (porcentaje / 100)) - efectivo],
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Informe mensual')

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `taxibill_${format(new Date(fecha + 'T00:00:00'), 'yyyy-MM')}.xlsx`)
}

// ─── EXCEL SEMANAL ─────────────────────────────────────────
export function exportarExcelSemana(fechaRef, registros, gastos, total, totalGastos, beneficioNeto, efectivo = 0, porcentaje = 45) {
  const wb = XLSX.utils.book_new()
  const inicio = startOfWeek(new Date(fechaRef + 'T00:00:00'), { weekStartsOn: 1 })
  const fin = endOfWeek(new Date(fechaRef + 'T00:00:00'), { weekStartsOn: 1 })
  const semanaStr = `${format(inicio, "d MMM", { locale: es })} – ${format(fin, "d MMM yyyy", { locale: es })}`
  const { porFecha, gastosPorFecha, fechas } = agruparDatos(registros, gastos, efectivo)

  const data = [
    [`TaxiBill — Semana ${semanaStr}`],
    [],
    ['Fecha', 'Taxímetro (€)', 'FreeNow (€)', 'Uber (€)', 'Total día (€)', 'Efectivo (€)', 'Gastos (€)'],
    ...fechas.map(f => [
      format(new Date(f + 'T00:00:00'), "EEE d MMM", { locale: es }),
      porFecha[f]?.taximetro || 0,
      porFecha[f]?.freenow || 0,
      porFecha[f]?.uber || 0,
      porFecha[f]?.total || 0,
      parseFloat((efectivo / Math.max(fechas.length, 1)).toFixed(2)),
      gastosPorFecha[f] || 0,
    ]),
    [],
    ['TOTAL',
      registros.filter(r => r.origen === 'taximetro' || !r.origen).reduce((a, r) => a + parseFloat(r.importe), 0),
      registros.filter(r => r.origen === 'freenow').reduce((a, r) => a + parseFloat(r.importe), 0),
      registros.filter(r => r.origen === 'uber').reduce((a, r) => a + parseFloat(r.importe), 0),
      total, efectivo, totalGastos,
    ],
    [],
    ['Resumen', ''],
    ['Total facturado', total],
    ['Efectivo recaudado', efectivo],
    ['Total gastos', totalGastos],
    [`Mi parte (${porcentaje}%)`, total * (porcentaje / 100)],
    ['Pendiente de cobro', (total * (porcentaje / 100)) - efectivo],
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Informe semanal')

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `taxibill_semana_${fechaRef}.xlsx`)
}