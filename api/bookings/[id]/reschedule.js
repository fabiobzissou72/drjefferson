import { mapAppointmentRow } from '../../../server/database.js';
import { authMiddleware, parseJsonBody, sendError, sendSuccess } from '../../../server/http.js';
import { findConflictingAppointments } from '../../../server/scheduling.js';
import { supabaseAdmin } from '../../../server/supabase.js';
import { appointmentUpdateSchema } from '../../../server/validations.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendError(response, 'Metodo nao permitido', 405);
  }

  if (!authMiddleware(request, response)) {
    return;
  }

  try {
    const bookingId = request.query.id;
    const body = await parseJsonBody(request);
    const validation = appointmentUpdateSchema.safeParse(body);

    if (!validation.success) {
      return sendError(response, validation.error.errors[0].message, 400);
    }

    const { data: existingAppointment, error: existingError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existingAppointment) {
      return sendError(response, 'Agendamento nao encontrado', 404);
    }

    const mergedAppointment = {
      patient_id: body.patientId || existingAppointment.patient_id,
      date: body.date || existingAppointment.date,
      time: body.time || existingAppointment.time,
      type: body.type || existingAppointment.type,
      notes: body.notes ?? existingAppointment.notes,
      status: existingAppointment.status
    };

    const { data: sameDayAppointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('date', mergedAppointment.date)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      throw appointmentsError;
    }

    const conflicts = await findConflictingAppointments({
      appointment: {
        date: mergedAppointment.date,
        time: mergedAppointment.time,
        type: mergedAppointment.type,
        status: mergedAppointment.status
      },
      appointments: sameDayAppointments || [],
      ignoreAppointmentId: bookingId
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
      .update({
        patient_id: mergedAppointment.patient_id,
        date: mergedAppointment.date,
        time: mergedAppointment.time,
        type: mergedAppointment.type,
        notes: mergedAppointment.notes ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return sendSuccess(response, mapAppointmentRow(appointment), 'Agendamento reagendado com sucesso');
  } catch (error) {
    console.error('Reschedule booking error:', error);
    return sendError(response, 'Erro ao reagendar', 500);
  }
}
