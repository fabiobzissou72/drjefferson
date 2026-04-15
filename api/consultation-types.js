import {
  defaultConsultationTypes,
  getConsultationTypesSetting,
  setConsultationTypesSetting
} from '../server/database.js';
import { authMiddleware, parseJsonBody, sendError, sendSuccess } from '../server/http.js';
import { consultationTypesUpdateSchema } from '../server/validations.js';

export default async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      const consultationTypes = await getConsultationTypesSetting();
      return sendSuccess(response, consultationTypes);
    } catch (error) {
      console.error('Get consultation types error:', error);
      return sendSuccess(response, defaultConsultationTypes);
    }
  }

  if (request.method === 'PUT') {
    if (!await authMiddleware(request, response)) {
      return;
    }

    try {
      const body = await parseJsonBody(request);
      const validation = consultationTypesUpdateSchema.safeParse(body);

      if (!validation.success) {
        return sendError(response, validation.error.errors[0].message, 400);
      }

      await setConsultationTypesSetting(validation.data);
      return sendSuccess(response, validation.data, 'Tipos de consulta atualizados com sucesso');
    } catch (error) {
      console.error('Update consultation types error:', error);
      return sendError(response, 'Erro ao atualizar tipos de consulta', 500);
    }
  }

  response.setHeader('Allow', 'GET, PUT');
  return sendError(response, 'Metodo nao permitido', 405);
}
