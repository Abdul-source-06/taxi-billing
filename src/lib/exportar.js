import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function exportarPDF(fecha, registros, gastos, total, totalGastos, beneficioNeto) {
  const doc = new jsPDF()
  const fechaStr = format(new Date(fecha + 'T00:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })

  // Cabecera
  doc.setFillColor(250, 204, 21)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(120, 80, 0)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('🚕 TaxiLog', 14, 15)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Informe del ${fechaStr}`, 14, 26)

  // Resumen
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen del día', 14, 48)

  autoTable(doc, {
    startY: 52,
    head: [['Concepto', 'Importe']],
    body: [
      ['Total ingresos', `${total.toFixed(2)} €`],
      ['Total gastos', `${totalGastos.toFixed(2)} €`],
      ['Beneficio neto', `${beneficioNeto.toFixed(2)} €`],
    ],
    headStyles: { fillColor: [250, 204, 21], textColor: [120, 80, 0], fontStyle: 'bold' },
    bodyStyles: { textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [255, 251, 235] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  // Servicios
  if (registros.length > 0) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Servicios', 14, doc.lastAutoTable.finalY + 14)

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [['Hora', 'Tipo', 'Notas', 'Importe']],
      body: registros.map(r => [
        r.hora?.slice(0, 5) || '',
        r.tipo,
        r.notas || '-',
        `${parseFloat(r.importe).toFixed(2)} €`
      ]),
      headStyles: { fillColor: [250, 204, 21], textColor: [120, 80, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      columnStyles: { 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    })
  }

  // Gastos
  if (gastos.length > 0) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Gastos', 14, doc.lastAutoTable.finalY + 14)

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 18,
      head: [['Hora', 'Concepto', 'Importe']],
      body: gastos.map(g => [
        g.hora?.slice(0, 5) || '',
        g.concepto,
        `${parseFloat(g.importe).toFixed(2)} €`
      ]),
      headStyles: { fillColor: [254, 202, 202], textColor: [185, 28, 28], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 241, 242] },
      columnStyles: { 2: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    })
  }

  // Pie de página
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generado por TaxiLog · ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 285)

  doc.save(`taxilog_${fecha}.pdf`)
}

export function exportarExcel(fecha, registros, gastos, total, totalGastos, beneficioNeto) {
  const wb = XLSX.utils.book_new()
  const fechaStr = format(new Date(fecha + 'T00:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })

  // Hoja 1 — Resumen
  const resumenData = [
    ['TaxiLog — Informe diario'],
    [fechaStr],
    [],
    ['RESUMEN', ''],
    ['Total ingresos', total],
    ['Total gastos', totalGastos],
    ['Beneficio neto', beneficioNeto],
  ]
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  wsResumen['!cols'] = [{ wch: 25 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  // Hoja 2 — Servicios
  if (registros.length > 0) {
    const serviciosData = [
      ['Hora', 'Tipo', 'Notas', 'Importe (€)'],
      ...registros.map(r => [
        r.hora?.slice(0, 5) || '',
        r.tipo,
        r.notas || '',
        parseFloat(r.importe)
      ]),
      [],
      ['TOTAL', '', '', total]
    ]
    const wsServicios = XLSX.utils.aoa_to_sheet(serviciosData)
    wsServicios['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 25 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsServicios, 'Servicios')
  }

  // Hoja 3 — Gastos
  if (gastos.length > 0) {
    const gastosData = [
      ['Hora', 'Concepto', 'Importe (€)'],
      ...gastos.map(g => [
        g.hora?.slice(0, 5) || '',
        g.concepto,
        parseFloat(g.importe)
      ]),
      [],
      ['TOTAL', '', totalGastos]
    ]
    const wsGastos = XLSX.utils.aoa_to_sheet(gastosData)
    wsGastos['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos')
  }

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `taxilog_${fecha}.xlsx`)
}