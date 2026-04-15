import bcrypt from 'bcryptjs';
import { generateToken } from '../../server/auth.js';
import { ensureAdminAccessToken } from '../../server/adminTokens.js';
import { parseJsonBody, sendError, sendSuccess } from '../../server/http.js';
import { supabaseAdmin } from '../../server/supabase.js';

const readEnv = (name, fallback = '') => {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : fallback;
};

const FALLBACK_ADMIN_EMAIL = readEnv('ADMIN_LOGIN_EMAIL', 'admin@drjefferson.local');
const FALLBACK_ADMIN_PASSWORD = readEnv('ADMIN_LOGIN_PASSWORD', 'Admin@123456');

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendError(response, 'Metodo nao permitido', 405);
  }

  try {
    const body = await parseJsonBody(request);
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return sendError(response, 'Email e senha sao obrigatorios', 400);
    }

    if (email === FALLBACK_ADMIN_EMAIL && password === FALLBACK_ADMIN_PASSWORD) {
      const token = generateToken({
        userId: 'local-admin',
        type: 'admin',
        email
      });

      return sendSuccess(response, {
        token,
        admin: {
          id: 'local-admin',
          email,
          fullName: 'Administrador'
        }
      }, 'Login realizado com sucesso');
    }

    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, full_name, password_hash, is_active, access_token, access_token_created_at')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST205') {
        return sendError(response, 'Administrador nao configurado no banco', 401);
      }
      throw error;
    }

    if (!admin || !admin.is_active) {
      return sendError(response, 'Credenciais invalidas', 401);
    }

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatches) {
      return sendError(response, 'Credenciais invalidas', 401);
    }

    const tokenData = await ensureAdminAccessToken(admin);

    return sendSuccess(response, {
      token: tokenData.token,
      tokenCreatedAt: tokenData.tokenCreatedAt,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name
      }
    }, 'Login realizado com sucesso');
  } catch (error) {
    console.error('Admin login error:', error);
    return sendError(response, 'Erro ao autenticar administrador', 500);
  }
}
