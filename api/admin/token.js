import { authMiddleware, sendError, sendSuccess } from '../../server/http.js';
import { getAdminTokenSnapshot, rotateAdminAccessToken } from '../../server/adminTokens.js';

const toPayload = (snapshot) => ({
  token: snapshot.token,
  tokenCreatedAt: snapshot.tokenCreatedAt,
  admin: {
    id: snapshot.id,
    email: snapshot.email,
    fullName: snapshot.fullName
  }
});

export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return sendError(response, 'Metodo nao permitido', 405);
  }

  if (!await authMiddleware(request, response)) {
    return;
  }

  const decoded = request.auth;
  if (!decoded || decoded.type !== 'admin') {
    return sendError(response, 'Token administrativo obrigatorio', 401);
  }

  if (request.method === 'GET') {
    try {
      const snapshot = await getAdminTokenSnapshot(decoded.userId);
      if (!snapshot) {
        return sendError(response, 'Administrador nao encontrado', 404);
      }

      return sendSuccess(response, toPayload(snapshot));
    } catch (error) {
      console.error('Admin token fetch error:', error);
      return sendError(response, 'Erro ao carregar token administrativo', 500);
    }
  }

  try {
    const rotated = await rotateAdminAccessToken(decoded.userId);
    if (!rotated) {
      return sendError(response, 'Administrador nao encontrado', 404);
    }

    return sendSuccess(response, toPayload({
      ...rotated.admin,
      token: rotated.token,
      tokenCreatedAt: rotated.tokenCreatedAt
    }), 'Novo token gerado com sucesso');
  } catch (error) {
    console.error('Admin token rotation error:', error);
    return sendError(response, 'Erro ao gerar novo token administrativo', 500);
  }
}
