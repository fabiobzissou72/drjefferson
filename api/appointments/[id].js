import { mapAppointmentRow } from '../../server/database.js';
import { authMiddleware, parseJsonBody, sendError, sendSuccess } from '../../server/http.js';
import { supabaseAdmin } from '../../server/supabase.js';
import { appointmentUpdateSchema } from '../../server/validations.js';

const isBlockedAppointment = (notes) => Boolean(notes?.startsWith('[BLOCKED_SLOT]'));

export default async function handler(request, response) {
  if (!await authMiddleware(request, response)) {
    return;
  }

  const appointmentId = request.query.id;

  if (request.method === 'GET') {
    try {
      const { data: appointment, error } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!appointment) {
        return sendError(response, 'Agendamento nao encontrado', 404);
      }

      return sendSuccess(response, mapAppointmentRow(appointment));
    } catch (error) {
      console.error('Get appointment error:', error);
      return sendError(response, 'Erro ao buscar agendamento', 500);
    }
  }

  if (request.method === 'PUT') {
    try {
      const body = await parseJsonBody(request);
      const validation = appointmentUpdateSchema.safeParse(body);

      if (!validation.success) {
        return sendError(response, validation.error.errors[0].message, 400);
      }

      const payload = {
        patient_id: body.patientId,
        date: body.date,
        time: body.time,
        type: body.type,
        notes: body.notes ?? null,
        updated_at: new Date().toISOString()
      };

      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      );

      const { data: appointment, error } = await supabaseAdmin
        .from('appointments')
        .update(cleanedPayload)
        .eq('id', appointmentId)
        .select('*')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!appointment) {
        return sendError(response, 'Agendamento nao encontrado', 404);
      }

      return sendSuccess(response, mapAppointmentRow(appointment), 'Agendamento atualizado com sucesso');
    } catch (error) {
      console.error('Update appointment error:', error);
      return sendError(response, 'Erro ao atualizar agendamento', 500);
    }
  }

  if (request.method === 'DELETE') {
    try {
      const permanent = request.query.permanent === 'true';
      const { data: appointment, error } = await supabaseAdmin
        .from('appointments')
        .select('id, notes')
        .eq('id', appointmentId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!appointment) {
        return sendError(response, 'Agendamento nao encontrado', 404);
      }

      if (permanent) {
        if (!isBlockedAppointment(appointment.notes)) {
          return sendError(response, 'Exclusao permanente permitida apenas para bloqueios', 400);
        }

        const { error: deleteError } = await supabaseAdmin
          .from('appointments')
          .delete()
          .eq('id', appointmentId);

        if (deleteError) {
          throw deleteError;
        }

        return sendSuccess(response, { id: appointmentId }, 'Bloqueio excluido com sucesso');
      }

      const { error: updateError } = await supabaseAdmin
        .from('appointments')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) {
        throw updateError;
      }

      return sendSuccess(response, { id: appointmentId }, 'Agendamento cancelado com sucesso');
    } catch (error) {
      console.error('Delete appointment error:', error);
      return sendError(response, 'Erro ao cancelar agendamento', 500);
    }
  }

  response.setHeader('Allow', 'GET, PUT, DELETE');
  return sendError(response, 'Metodo nao permitido', 405);
}
