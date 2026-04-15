import { mapPatientInput, mapPatientRow } from '../../server/database.js';
import { authMiddleware, parseJsonBody, sendError, sendSuccess } from '../../server/http.js';
import { supabaseAdmin } from '../../server/supabase.js';
import { patientUpdateSchema } from '../../server/validations.js';

export default async function handler(request, response) {
  if (!await authMiddleware(request, response)) {
    return;
  }

  const patientId = request.query.id;

  if (request.method === 'GET') {
    try {
      const { data: patient, error } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!patient) {
        return sendError(response, 'Paciente nao encontrado', 404);
      }

      return sendSuccess(response, mapPatientRow(patient));
    } catch (error) {
      console.error('Get patient error:', error);
      return sendError(response, 'Erro ao buscar paciente', 500);
    }
  }

  if (request.method === 'PUT') {
    try {
      const body = await parseJsonBody(request);
      const validation = patientUpdateSchema.safeParse(body);

      if (!validation.success) {
        return sendError(response, validation.error.errors[0].message, 400);
      }

      const { data: patient, error } = await supabaseAdmin
        .from('patients')
        .update(mapPatientInput(body))
        .eq('id', patientId)
        .select('*')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!patient) {
        return sendError(response, 'Paciente nao encontrado', 404);
      }

      return sendSuccess(response, mapPatientRow(patient), 'Paciente atualizado com sucesso');
    } catch (error) {
      console.error('Update patient error:', error);
      return sendError(response, 'Erro ao atualizar paciente', 500);
    }
  }

  if (request.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('patients')
        .delete()
        .eq('id', patientId);

      if (error) {
        throw error;
      }

      return sendSuccess(response, { id: patientId }, 'Paciente deletado com sucesso');
    } catch (error) {
      console.error('Delete patient error:', error);
      return sendError(response, 'Erro ao deletar paciente', 500);
    }
  }

  response.setHeader('Allow', 'GET, PUT, DELETE');
  return sendError(response, 'Metodo nao permitido', 405);
}
