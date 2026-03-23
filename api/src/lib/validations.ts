import { z } from 'zod';

const appointmentTypeValues = ['first', 'checkup', 'return', 'emergency'] as const;
const consultationModeValues = ['presential', 'online', 'mixed'] as const;

export const patientCreateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF invalido (formato: 000.000.000-00)'),
  phone: z.string().regex(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, 'Telefone invalido'),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida').optional(),
  notes: z.string().max(1000).optional()
});

export const patientUpdateSchema = patientCreateSchema.partial();

export const appointmentCreateSchema = z.object({
  patientId: z.string().uuid('ID de paciente invalido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida (formato: YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horario invalido (formato: HH:mm ou HH:mm:ss)'),
  type: z.enum(appointmentTypeValues),
  notes: z.string().max(1000).optional()
});

export const appointmentUpdateSchema = z.object({
  patientId: z.string().uuid('ID de paciente invalido').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida').optional(),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horario invalido').optional(),
  type: z.enum(appointmentTypeValues).optional(),
  notes: z.string().max(1000).optional()
});

export const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'missed', 'cancelled'])
});

export const consultationTypeSchema = z.object({
  id: z.string().min(1, 'ID obrigatorio'),
  value: z.enum(appointmentTypeValues),
  label: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  mode: z.enum(consultationModeValues),
  durationMinutes: z.number().int().min(15, 'Duracao minima de 15 minutos').max(240, 'Duracao maxima de 240 minutos'),
  price: z.number().min(0, 'Valor nao pode ser negativo'),
  active: z.boolean()
});

export const consultationTypesUpdateSchema = z.array(consultationTypeSchema).min(1, 'Informe ao menos um tipo de consulta');
