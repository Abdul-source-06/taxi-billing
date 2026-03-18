import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function exportarPDF(fecha, registros, gastos, total, totalGastos, beneficioNeto, efectivo = 0, porcentaje = 45) {
  const doc = new jsPDF()

  // Cabecera
  doc.setFillColor(250, 204, 21)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(120, 80, 0)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('TaxiLog', 14, 15)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Informe del mes — ${format(new Date(fecha + 'T00:00:00'), "MMMM yyyy", { locale: es })}`, 14, 26)

  // Agrupa registros por fecha
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

  const fechas = Object.keys(porFecha).sort()

  // Resumen del mes
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen del mes', 14, 48)

  autoTable(doc, {
    startY: 52,
    head: [['Fecha', 'Taxímetro', 'FreeNow', 'Uber', 'Total día', 'Efectivo', 'Gastos']],
    body: fechas.map(f => [
      format(new Date(f + 'T00:00:00'), "EEE d MMM", { locale: es }),
      `${porFecha[f].taximetro.toFixed(2)} €`,
      `${porFecha[f].freenow.toFixed(2)} €`,
      `${porFecha[f].uber.toFixed(2)} €`,
      `${porFecha[f].total.toFixed(2)} €`,
      `${(efectivo / fechas.length).toFixed(2)} €`,
      `${(gastosPorFecha[f] || 0).toFixed(2)} €`,
    ]),
    foot: [[
      'TOTAL',
      `${registros.filter(r => r.origen === 'taximetro' || !r.origen).reduce((a, r) => a + parseFloat(r.importe), 0).toFixed(2)} €`,
      `${registros.filter(r => r.origen === 'freenow').reduce((a, r) => a + parseFloat(r.importe), 0).toFixed(2)} €`,
      `${registros.filter(r => r.origen === 'uber').reduce((a, r) => a + parseFloat(r.importe), 0).toFixed(2)} €`,
      `${total.toFixed(2)} €`,
      `${efectivo.toFixed(2)} €`,
      `${totalGastos.toFixed(2)} €`,
    ]],
    headStyles: { fillColor: [250, 204, 21], textColor: [120, 80, 0], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { textColor: [40, 40, 40], fontSize: 8 },
    footStyles: { fillColor: [250, 204, 21], textColor: [120, 80, 0], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    columnStyles: {
      0: { halign: 'left', cellWidth: 22 },
      1: { halign: 'left', cellWidth: 27 },
      2: { halign: 'left', cellWidth: 27 },
      3: { halign: 'left', cellWidth: 27 },
      4: { halign: 'left', fontStyle: 'bold', cellWidth: 27 },
      5: { halign: 'left', cellWidth: 27 },
      6: { halign: 'left', cellWidth: 27 },
    },
    margin: { left: 7, right: 7 },
  })

  // Resumen final
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Concepto', 'Importe']],
    body: [
      ['Total facturado', `${total.toFixed(2)} €`],
      ['Efectivo recaudado', `${efectivo.toFixed(2)} €`],
      ['Total gastos', `${totalGastos.toFixed(2)} €`],
      [`Mi parte (${porcentaje}%)`, `${(total * (porcentaje / 100)).toFixed(2)} €`],
      ['Pendiente de cobro', `${((total * (porcentaje / 100)) - efectivo).toFixed(2)} €`],
    ],
    headStyles: { fillColor: [250, 204, 21], textColor: [120, 80, 0], fontStyle: 'bold' },
    bodyStyles: { textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  // Pie de página
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generado por TaxiLog · ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 285)

  doc.save(`taxilog_${format(new Date(fecha + 'T00:00:00'), 'yyyy-MM')}.pdf`)
}

export function exportarExcel(fecha, registros, gastos, total, totalGastos, beneficioNeto, efectivo = 0, porcentaje = 45) {
  const wb = XLSX.utils.book_new()
  const mesStr = format(new Date(fecha + 'T00:00:00'), "MMMM yyyy", { locale: es })

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

  const fechas = Object.keys(porFecha).sort()

  const data = [
    [`TaxiLog — Informe ${mesStr}`],
    [],
    ['Fecha', 'Taxímetro (€)', 'FreeNow (€)', 'Uber (€)', 'Total día (€)', 'Efectivo (€)', 'Gastos (€)'],
    ...fechas.map(f => [
      format(new Date(f + 'T00:00:00'), "EEE d MMM", { locale: es }),
      porFecha[f].taximetro,
      porFecha[f].freenow,
      porFecha[f].uber,
      porFecha[f].total,
      parseFloat((efectivo / fechas.length).toFixed(2)),
      gastosPorFecha[f] || 0,
    ]),
    [],
    [
      'TOTAL',
      registros.filter(r => r.origen === 'taximetro' || !r.origen).reduce((a, r) => a + parseFloat(r.importe), 0),
      registros.filter(r => r.origen === 'freenow').reduce((a, r) => a + parseFloat(r.importe), 0),
      registros.filter(r => r.origen === 'uber').reduce((a, r) => a + parseFloat(r.importe), 0),
      total,
      efectivo,
      totalGastos,
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
  saveAs(blob, `taxilog_${format(new Date(fecha + 'T00:00:00'), 'yyyy-MM')}.xlsx`)
}