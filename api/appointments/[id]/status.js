import { mapAppointmentRow } from '../../../server/database.js';
import { authMiddleware, parseJsonBody, sendError, sendSuccess } from '../../../server/http.js';
import { supabaseAdmin } from '../../../server/supabase.js';
import { statusUpdateSchema } from '../../../server/validations.js';

export default async function handler(request, response) {
  if (request.method !== 'PATCH') {
    response.setHeader('Allow', 'PATCH');
    return sendError(response, 'Metodo nao permitido', 405);
  }

  if (!await authMiddleware(request, response)) {
    return;
  }

  try {
    const body = await parseJsonBody(request);
    const validation = statusUpdateSchema.safeParse(body);

    if (!validation.success) {
      return sendError(response, validation.error.errors[0].message, 400);
    }

    const appointmentId = request.query.id;
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!appointment) {
      return sendError(response, 'Agendamento nao encontrado', 404);
    }

    const statusMessages = {
      pending: 'Agendamento marcado como pendente',
      confirmed: 'Agendamento confirmado',
      completed: 'Paciente compareceu',
      missed: 'Paciente faltou',
      cancelled: 'Agendamento cancelado'
    };

    return sendSuccess(response, mapAppointmentRow(appointment), statusMessages[body.status]);
  } catch (error) {
    console.error('Update status error:', error);
    return sendError(response, 'Erro ao atualizar status', 500);
  }
}
