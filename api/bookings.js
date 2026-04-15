import { mapAppointmentRow } from '../server/database.js';
import { authMiddleware, parseJsonBody, sendError, sendSuccess } from '../server/http.js';
import { findConflictingAppointments } from '../server/scheduling.js';
import { supabaseAdmin } from '../server/supabase.js';
import { appointmentCreateSchema } from '../server/validations.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendError(response, 'Metodo nao permitido', 405);
  }

  if (!await authMiddleware(request, response)) {
    return;
  }

  try {
    const body = await parseJsonBody(request);
    const validation = appointmentCreateSchema.safeParse(body);

    if (!validation.success) {
      return sendError(response, validation.error.errors[0].message, 400);
    }

    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', body.patientId)
      .maybeSingle();

    if (patientError) {
      throw patientError;
    }

    if (!patient) {
      return sendError(response, 'Cliente nao encontrado', 404);
    }

    const { data: sameDayAppointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('date', body.date)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      throw appointmentsError;
    }

    const conflicts = await findConflictingAppointments({
      appointment: {
        date: body.date,
        time: body.time,
        type: body.type,
        status: 'pending'
      },
      appointments: sameDayAppointments || []
    });

    if (conflicts.length > 0) {
      return response.status(409).json({
        success: false,
        error: 'Ja existe um agendamento conflitante nesse horario',
        conflicts: conflicts.map(mapAppointmentRow)
      });
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id: body.patientId,
        date: body.date,
        time: body.time,
        type: body.type,
        status: 'pending',
        notes: body.notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return sendSuccess(response, mapAppointmentRow(appointment), 'Agendamento criado com sucesso', 201);
  } catch (error) {
    console.error('Create booking error:', error);
    return sendError(response, 'Erro ao criar agendamento', 500);
  }
}
