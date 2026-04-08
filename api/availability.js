import { authMiddleware, sendError, sendSuccess } from '../server/http.js';
import { supabaseAdmin } from '../server/supabase.js';
import { buildAvailability } from '../server/scheduling.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendError(response, 'Metodo nao permitido', 405);
  }

  if (!authMiddleware(request, response)) {
    return;
  }

  const date = String(request.query.date || '').trim();
  const type = String(request.query.type || 'first').trim();

  if (!date) {
    return sendError(response, 'Data e obrigatoria no formato YYYY-MM-DD', 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('date', date)
      .neq('status', 'cancelled')
      .order('time', { ascending: true });

    if (error) {
      throw error;
    }

    const availability = await buildAvailability(date, type, data || []);
    return sendSuccess(response, availability, 'Horarios consultados com sucesso');
  } catch (error) {
    console.error('Availability error:', error);
    return sendError(response, 'Erro ao consultar horarios', 500);
  }
}
