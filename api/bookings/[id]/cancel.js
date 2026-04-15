import { mapAppointmentRow } from '../../../server/database.js';
import { authMiddleware, sendError, sendSuccess } from '../../../server/http.js';
import { supabaseAdmin } from '../../../server/supabase.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendError(response, 'Metodo nao permitido', 405);
  }

  if (!await authMiddleware(request, response)) {
    return;
  }

  try {
    const bookingId = request.query.id;
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!appointment) {
      return sendError(response, 'Agendamento nao encontrado', 404);
    }

    return sendSuccess(response, mapAppointmentRow(appointment), 'Agendamento cancelado com sucesso');
  } catch (error) {
    console.error('Cancel booking error:', error);
    return sendError(response, 'Erro ao cancelar agendamento', 500);
  }
}
