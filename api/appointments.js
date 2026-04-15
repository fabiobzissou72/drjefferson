import { mapAppointmentRow } from '../server/database.js';
import { authMiddleware, parseJsonBody, sendError, sendSuccess } from '../server/http.js';
import { supabaseAdmin } from '../server/supabase.js';
import { appointmentCreateSchema } from '../server/validations.js';

export default async function handler(request, response) {
  if (!await authMiddleware(request, response)) {
    return;
  }

  if (request.method === 'GET') {
    try {
      const date = request.query.date;
      const status = request.query.status;
      const patientId = request.query.patientId;

      let query = supabaseAdmin
        .from('appointments')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (date) query = query.eq('date', date);
      if (status) query = query.eq('status', status);
      if (patientId) query = query.eq('patient_id', patientId);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const appointments = (data || []).map(mapAppointmentRow);
      return sendSuccess(response, appointments);
    } catch (error) {
      console.error('List appointments error:', error);
      return sendError(response, 'Erro ao listar agendamentos', 500);
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await parseJsonBody(request);
      const validation = appointmentCreateSchema.safeParse(body);

      if (!validation.success) {
        return sendError(response, validation.error.errors[0].message, 400);
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
      console.error('Create appointment error:', error);
      return sendError(response, 'Erro ao criar agendamento', 500);
    }
  }

  response.setHeader('Allow', 'GET, POST');
  return sendError(response, 'Metodo nao permitido', 405);
}
