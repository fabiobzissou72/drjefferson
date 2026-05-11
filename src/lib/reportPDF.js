import { jsPDF } from 'jspdf'
import { PLAN_TYPES } from './planTypes'
import { DEFAULT_CONSULTATION_TYPES, getConsultationTypeDetails } from './consultationTypes'

const WEEKDAYS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function formatDateBR(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const weekday = WEEKDAYS_PT[d.getDay()]
  return { short: `${day}/${month}/${year}`, weekday, month: MONTHS_PT[d.getMonth()], year }
}

function formatBirthDate(birthDate) {
  if (!birthDate) return ''
  const d = new Date(birthDate + 'T00:00:00')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatTimeShort(time) {
  if (!time) return ''
  const [h, m] = time.slice(0, 5).split(':')
  const min = parseInt(m)
  return min > 0 ? `${parseInt(h)}h${String(min).padStart(2, '0')}` : `${parseInt(h)}h`
}

function getConsultationInfo(appointment, patient) {
  // Try to get info from patient's plan + consultation dates
  if (patient?.planType) {
    const plan = PLAN_TYPES[patient.planType]
    if (plan) {
      if (plan.consultations === 1) {
        const online = plan.id === 'personalizada_online'
        return { label: online ? 'Consulta Personalizada Online' : 'Consulta Personalizada Presencial', number: 1, total: 1, price: plan.price, online }
      }

      let consultationNumber = null
      if (appointment.date === patient.consultation1Date) consultationNumber = 1
      else if (appointment.date === patient.consultation2Date) consultationNumber = 2
      else if (appointment.date === patient.consultation3Date) consultationNumber = 3

      let online = false
      if (plan.id === 'trimestral_misto') {
        const order = consultationNumber || 2 // assume online for misto if unknown
        const consultType = plan.consultationTypes.find(c => c.order === order)
        online = consultType?.mode === 'online'
      }

      const planLabel = plan.id === 'trimestral_misto' ? 'Plano Trimestral Misto' : 'Plano Trimestral Presencial'
      return { label: planLabel, number: consultationNumber, total: 3, price: 0, online }
    }
  }

  // Fallback: use appointment type label
  const aptType = getConsultationTypeDetails(appointment.type, DEFAULT_CONSULTATION_TYPES)
  const online = aptType.mode === 'online'
  return { label: aptType.label || 'Consulta', number: null, total: null, price: aptType.price || 0, online }
}

function buildPlanLines(info) {
  const numStr = info.number && info.total ? ` ${info.number}/${info.total}` : ''
  const label = info.label || ''

  if (label.includes('Trimestral') && (label.includes('Misto') || label.includes('misto'))) {
    const lines = ['Plano Trimestral', `Misto${numStr}`]
    if (info.online) lines.push('(online)')
    return lines
  }
  if (label.includes('Trimestral') && (label.includes('Presencial') || label.includes('presencial'))) {
    return ['Plano Trimestral', `Presencial${numStr}`]
  }
  if (label.includes('Personalizada')) {
    const mode = info.online ? 'Online' : 'Presencial'
    return ['Consulta Personalizada', mode + numStr]
  }
  return [label + numStr]
}

function getCityFromAppointmentOrPatient(appointment, patient) {
  if (appointment.city) return appointment.city
  if (appointment.notes) {
    const match = appointment.notes.match(/\[CIDADE:([^\]]+)\]/)
    if (match) return match[1]
  }
  return patient?.city || ''
}

export function generateDailyReport(dateStr, appointments, getPatient) {
  const dateInfo = formatDateBR(dateStr)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentW = pageW - margin * 2

  const COL_TIME = 22
  const COL_TOTAL = 58
  const COL_PATIENT = contentW - COL_TIME - COL_TOTAL

  // --- HEADER ---
  const GREEN = [50, 200, 50]
  const BLACK = [0, 0, 0]
  const RED = [220, 0, 0]

  // Row 1: ATENDIMENTOS MES ANO
  doc.setFillColor(...GREEN)
  doc.rect(margin, 12, contentW, 9, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...BLACK)
  doc.text(`ATENDIMENTOS ${dateInfo.month.toUpperCase()} ${dateInfo.year}`, pageW / 2, 19, { align: 'center' })

  // Row 2: CITY
  let cityLabel = ''
  for (const apt of appointments) {
    const patient = getPatient(apt.patient_id)
    const city = getCityFromAppointmentOrPatient(apt, patient)
    if (city) { cityLabel = `${city.toUpperCase()}-PI`; break }
  }
  doc.setFillColor(...GREEN)
  doc.rect(margin, 22, contentW, 9, 'F')
  doc.setFontSize(13)
  doc.text(cityLabel || '', pageW / 2, 29, { align: 'center' })

  // Row 3: DATE
  doc.setFillColor(...GREEN)
  doc.rect(margin, 32, contentW, 9, 'F')
  doc.setFontSize(12)
  doc.text(`DATA: ${dateInfo.short} (${dateInfo.weekday})`, pageW / 2, 39, { align: 'center' })

  // Group by period
  const manha = appointments.filter(a => { const h = parseInt(a.time?.split(':')[0] || 0); return h >= 6 && h < 12 })
  const tarde = appointments.filter(a => { const h = parseInt(a.time?.split(':')[0] || 0); return h >= 12 && h < 18 })
  const noite = appointments.filter(a => { const h = parseInt(a.time?.split(':')[0] || 0); return h >= 18 || h < 6 })

  let yPos = 46
  let totalDia = 0

  const PERIOD_H = 8
  const THEAD_H = 8
  const ROW_H = 20

  const renderPeriod = (label, list) => {
    if (list.length === 0) return

    // Period header — bordered box, red text
    doc.setDrawColor(...BLACK)
    doc.setLineWidth(0.5)
    doc.rect(margin, yPos, contentW, PERIOD_H, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...RED)
    doc.text(label, pageW / 2, yPos + PERIOD_H - 1.5, { align: 'center' })
    yPos += PERIOD_H

    // Table outer border (will grow as rows are added)
    const tableStartY = yPos

    // Column header row
    doc.setFillColor(220, 220, 220)
    doc.rect(margin, yPos, contentW, THEAD_H, 'F')
    doc.setDrawColor(...BLACK)
    doc.setLineWidth(0.3)
    doc.rect(margin, yPos, contentW, THEAD_H, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...BLACK)
    doc.text('HORÁRIO', margin + COL_TIME / 2, yPos + 5.5, { align: 'center' })
    doc.text('PACIENTE', margin + COL_TIME + COL_PATIENT / 2, yPos + 5.5, { align: 'center' })
    doc.text('TOTAL', margin + COL_TIME + COL_PATIENT + COL_TOTAL / 2, yPos + 5.5, { align: 'center' })
    // Vertical lines in header
    doc.line(margin + COL_TIME, yPos, margin + COL_TIME, yPos + THEAD_H)
    doc.line(margin + COL_TIME + COL_PATIENT, yPos, margin + COL_TIME + COL_PATIENT, yPos + THEAD_H)
    yPos += THEAD_H

    list.forEach((apt) => {
      const patient = getPatient(apt.patient_id)
      const info = getConsultationInfo(apt, patient)
      const birthDate = formatBirthDate(patient?.birthDate || patient?.birth_date)
      const timeStr = formatTimeShort(apt.time)
      const planLines = buildPlanLines(info)

      totalDia += info.price

      // Row background
      doc.setFillColor(255, 255, 255)
      doc.rect(margin, yPos, contentW, ROW_H, 'F')

      // Row border
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.2)
      doc.rect(margin, yPos, contentW, ROW_H, 'S')

      // Column separators
      doc.setDrawColor(180, 180, 180)
      doc.line(margin + COL_TIME, yPos, margin + COL_TIME, yPos + ROW_H)
      doc.line(margin + COL_TIME + COL_PATIENT, yPos, margin + COL_TIME + COL_PATIENT, yPos + ROW_H)

      // Time — RED bold, vertically centered
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...RED)
      doc.text(timeStr, margin + COL_TIME / 2, yPos + ROW_H / 2 + 1.5, { align: 'center' })

      // Patient name — bold black, centered
      const patientCenterX = margin + COL_TIME + COL_PATIENT / 2
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...BLACK)
      const nameY = birthDate ? yPos + 8 : yPos + ROW_H / 2 + 1.5
      doc.text(patient?.name || 'Paciente', patientCenterX, nameY, { align: 'center', maxWidth: COL_PATIENT - 4 })

      // Birth date — smaller normal
      if (birthDate) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(60, 60, 60)
        doc.text(birthDate, patientCenterX, yPos + 14, { align: 'center' })
      }

      // Plan info in TOTAL column — centered, multi-line
      if (planLines.length > 0) {
        const totalCenterX = margin + COL_TIME + COL_PATIENT + COL_TOTAL / 2
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...BLACK)
        const lineH = 5
        const blockH = planLines.length * lineH
        const startY = yPos + (ROW_H - blockH) / 2 + lineH - 1
        planLines.forEach((line, i) => {
          doc.text(line, totalCenterX, startY + i * lineH, { align: 'center' })
        })
      }

      yPos += ROW_H
    })

    yPos += 6
  }

  renderPeriod('Manhã', manha)
  renderPeriod('Tarde', tarde)
  renderPeriod('Noite', noite)

  // TOTAL GERAL
  yPos += 2
  doc.setFillColor(255, 255, 0)
  doc.rect(margin, yPos, contentW, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...RED)
  const totalStr = `TOTAL=${totalDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
  doc.text(totalStr, pageW / 2, yPos + 7, { align: 'center' })

  const filename = `atendimentos_${dateStr}.pdf`
  doc.save(filename)
}
