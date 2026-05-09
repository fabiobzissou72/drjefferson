import { jsPDF } from 'jspdf'
import { PLAN_TYPES } from './planTypes'

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

function getConsultationInfo(appointment, patient) {
  if (!patient || !patient.planType) return { label: 'Consulta', number: null, total: null, price: 0 }

  const plan = PLAN_TYPES[patient.planType]
  if (!plan) return { label: 'Consulta', number: null, total: null, price: 0 }

  // Avulsa (1 consulta)
  if (plan.consultations === 1) {
    const mode = plan.id === 'personalizada_online' ? 'Online' : 'Presencial'
    return { label: `Consulta Personalizada ${mode}`, number: 1, total: 1, price: plan.price }
  }

  // Plano trimestral — determina qual consulta pela data
  let consultationNumber = null
  if (appointment.date === patient.consultation1Date) consultationNumber = 1
  else if (appointment.date === patient.consultation2Date) consultationNumber = 2
  else if (appointment.date === patient.consultation3Date) consultationNumber = 3

  const planLabel = plan.id === 'trimestral_misto' ? 'Plano Trimestral Misto' : 'Plano Trimestral Presencial'

  // Determina se esta consulta específica é online (para Misto)
  let modeLabel = ''
  if (plan.id === 'trimestral_misto' && consultationNumber) {
    const consultType = plan.consultationTypes.find(c => c.order === consultationNumber)
    if (consultType?.mode === 'online') modeLabel = ' (online)'
  }

  return {
    label: `${planLabel}${modeLabel}`,
    number: consultationNumber,
    total: 3,
    price: 0 // plano já pago
  }
}

function getCityFromAppointmentOrPatient(appointment, patient) {
  // Tenta extrair cidade das notas do agendamento
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
  const colW = pageW - margin * 2

  // --- HEADER ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(0, 120, 0)
  doc.text(`ATENDIMENTOS ${dateInfo.month.toUpperCase()} ${dateInfo.year}`, pageW / 2, 22, { align: 'center' })

  // Determina cidade predominante dos agendamentos
  let cityLabel = ''
  for (const apt of appointments) {
    const patient = getPatient(apt.patient_id)
    const city = getCityFromAppointmentOrPatient(apt, patient)
    if (city) { cityLabel = `${city.toUpperCase()}-PI`; break }
  }
  if (cityLabel) {
    doc.setFontSize(16)
    doc.text(cityLabel, pageW / 2, 31, { align: 'center' })
  }

  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text(`DATA: ${dateInfo.short} (${dateInfo.weekday})`, pageW / 2, 40, { align: 'center' })

  // Linha separadora
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(margin, 45, pageW - margin, 45)

  // Período (Manhã/Tarde/Noite)
  // Agrupamos por período
  const manha = appointments.filter(a => {
    const h = parseInt(a.time?.split(':')[0] || 0)
    return h >= 6 && h < 12
  })
  const tarde = appointments.filter(a => {
    const h = parseInt(a.time?.split(':')[0] || 0)
    return h >= 12 && h < 18
  })
  const noite = appointments.filter(a => {
    const h = parseInt(a.time?.split(':')[0] || 0)
    return h >= 18 || h < 6
  })

  let yPos = 52
  let totalDia = 0

  const renderPeriod = (label, list) => {
    if (list.length === 0) return

    // Cabeçalho do período
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, yPos - 5, colW, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(label, pageW / 2, yPos, { align: 'center' })
    yPos += 8

    // Cabeçalho da tabela
    doc.setFillColor(230, 230, 230)
    doc.rect(margin, yPos - 5, colW, 8, 'F')
    doc.setFontSize(10)
    doc.text('HORÁRIO', margin + 2, yPos)
    doc.text('PACIENTE', margin + 35, yPos)
    doc.text('TOTAL', pageW - margin - 2, yPos, { align: 'right' })
    doc.setLineWidth(0.3)
    doc.line(margin, yPos + 2, pageW - margin, yPos + 2)
    yPos += 8

    list.forEach((apt, idx) => {
      const patient = getPatient(apt.patient_id)
      const info = getConsultationInfo(apt, patient)
      const birthDate = formatBirthDate(patient?.birthDate || patient?.birth_date)
      const numberStr = info.number && info.total ? ` ${info.number}/${info.total}` : ''
      const consultLabel = `${info.label}${numberStr}`
      const priceStr = info.price > 0
        ? info.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : ''

      totalDia += info.price

      // Linha alternada
      if (idx % 2 === 0) {
        doc.setFillColor(252, 252, 252)
        doc.rect(margin, yPos - 5, colW, 16, 'F')
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.text(apt.time?.slice(0, 5) || '', margin + 2, yPos)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(patient?.name || 'Paciente', margin + 35, yPos)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      if (birthDate) doc.text(birthDate, margin + 35, yPos + 5)
      doc.text(consultLabel, margin + 35, yPos + 10)

      if (priceStr) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(0, 100, 0)
        doc.text(priceStr, pageW - margin - 2, yPos + 5, { align: 'right' })
      }

      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.line(margin, yPos + 13, pageW - margin, yPos + 13)
      yPos += 16
    })

    yPos += 4
  }

  renderPeriod('Manhã', manha)
  renderPeriod('Tarde', tarde)
  renderPeriod('Noite', noite)

  // TOTAL GERAL
  yPos += 4
  doc.setFillColor(255, 255, 0)
  doc.rect(margin, yPos - 6, colW, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(200, 0, 0)
  const totalStr = `TOTAL=${totalDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
  doc.text(totalStr, pageW / 2, yPos, { align: 'center' })

  const filename = `atendimentos_${dateStr}.pdf`
  doc.save(filename)
}
