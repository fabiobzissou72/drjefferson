const normalizeText = (value) =>
  String(value == null ? '' : value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const onlyDigits = (value = '') => value.toString().replace(/\D/g, '')

export const matchesPatientSearch = (patient, searchTerm) => {
  const normalizedSearch = normalizeText(searchTerm)
  const digitSearch = onlyDigits(searchTerm)

  if (!normalizedSearch && !digitSearch) {
    return true
  }

  const patientName = normalizeText(patient?.name)
  const patientCpf = onlyDigits(patient?.cpf)
  const patientPhone = onlyDigits(patient?.phone)
  const patientEmail = normalizeText(patient?.email)

  return (
    patientName.includes(normalizedSearch) ||
    patientEmail.includes(normalizedSearch) ||
    (digitSearch ? patientCpf.includes(digitSearch) || patientPhone.includes(digitSearch) : false)
  )
}
