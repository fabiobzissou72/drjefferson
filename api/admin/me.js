import { authMiddleware, sendError, sendSuccess } from '../../server/http.js';
import { supabaseAdmin } from '../../server/supabase.js';

const readEnv = (name, fallback = '') => {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : fallback;
};

const FALLBACK_ADMIN_EMAIL = readEnv('ADMIN_LOGIN_EMAIL', 'admin@drjefferson.local');

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return sendError(response, 'Metodo nao permitido', 405);
  }

  if (!await authMiddleware(request, response)) {
    return;
  }

  const decoded = request.auth;
  if (!decoded || decoded.type !== 'admin') {
    return sendError(response, 'Token invalido ou expirado', 401);
  }

  if (decoded.userId === 'local-admin') {
    return sendSuccess(response, {
      id: 'local-admin',
      email: decoded.email || FALLBACK_ADMIN_EMAIL,
      fullName: 'Administrador'
    });
  }

  try {
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, full_name, is_active')
      .eq('id', decoded.userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST205') {
        return sendError(response, 'Administrador nao configurado no banco', 401);
      }
      throw error;
    }

    if (!admin || !admin.is_active) {
      return sendError(response, 'Administrador nao encontrado', 401);
    }

    return sendSuccess(response, {
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name
    });
  } catch (error) {
    console.error('Admin me error:', error);
    return sendError(response, 'Erro ao validar sessao', 500);
  }
}
