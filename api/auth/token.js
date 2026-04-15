import { generateToken } from '../../server/auth.js';
import { parseJsonBody, sendError, sendSuccess } from '../../server/http.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendError(response, 'Metodo nao permitido', 405);
  }

  try {
    const body = await parseJsonBody(request);
    const apiKey = body?.apiKey;

    if (!apiKey) {
      return sendError(response, 'API Key e obrigatoria', 400);
    }

    const validApiKey = process.env.API_TOKEN;
    if (apiKey !== validApiKey) {
      return sendError(response, 'API Key invalida', 401);
    }

    const token = generateToken({
      userId: 'api-user',
      type: 'api'
    });

    return sendSuccess(response, {
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      type: 'Bearer'
    }, 'Token gerado com sucesso');
  } catch (error) {
    console.error('Token error:', error);
    return sendError(response, 'Erro ao gerar token', 500);
  }
}
