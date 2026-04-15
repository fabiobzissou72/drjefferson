import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminAccessToken, findAdminByAccessToken, getAdminTokenSnapshot, rotateAdminAccessToken } from '@/lib/admin-tokens';
import { generateApiResponse, generateErrorResponse } from '@/lib/api';
import { extractToken, verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

const getAction = (params: { action?: string[] }) => params.action?.[0] || '';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toAdminPayload = (admin: { id: string; email: string; full_name?: string | null; fullName?: string | null }) => ({
  id: admin.id,
  email: admin.email,
  fullName: admin.full_name || admin.fullName || 'Administrador'
});

const toTokenPayload = (snapshot: { id: string; email: string; fullName: string; token: string; tokenCreatedAt: string | null }) => ({
  token: snapshot.token,
  tokenCreatedAt: snapshot.tokenCreatedAt,
  admin: {
    id: snapshot.id,
    email: snapshot.email,
    fullName: snapshot.fullName
  }
});

async function resolveAdminFromRequest(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) {
    return { error: generateErrorResponse('Token nao fornecido', 401), adminId: null as string | null };
  }

  const decoded = verifyToken(token);
  if (decoded?.type === 'admin' && UUID_REGEX.test(decoded.userId)) {
    return { error: null, adminId: decoded.userId };
  }

  const admin = await findAdminByAccessToken(token);
  if (admin) {
    return { error: null, adminId: admin.id };
  }

  return { error: generateErrorResponse('Token invalido ou expirado', 401), adminId: null as string | null };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { action?: string[] } }
) {
  const action = getAction(params);

  if (action === 'login') {
    try {
      const body = await request.json();
      const email = String(body?.email || '').trim().toLowerCase();
      const password = String(body?.password || '');

      if (!email || !password) {
        return NextResponse.json({
          success: false,
          error: 'Email e senha sao obrigatorios'
        }, { status: 400 });
      }

      const { data: admin, error } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, full_name, password_hash, is_active, access_token, access_token_created_at')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!admin || !admin.is_active) {
        return NextResponse.json({
          success: false,
          error: 'Credenciais invalidas'
        }, { status: 401 });
      }

      const passwordMatches = await bcrypt.compare(password, admin.password_hash);
      if (!passwordMatches) {
        return NextResponse.json({
          success: false,
          error: 'Credenciais invalidas'
        }, { status: 401 });
      }

      const tokenData = await ensureAdminAccessToken(admin);
      if (!tokenData) {
        return generateErrorResponse('Nao foi possivel gerar token administrativo', 500);
      }

      return NextResponse.json({
        success: true,
        data: {
          token: tokenData.token,
          tokenCreatedAt: tokenData.tokenCreatedAt,
          admin: toAdminPayload(admin)
        },
        message: 'Login realizado com sucesso'
      });
    } catch (error) {
      console.error('Admin login error:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao autenticar administrador'
      }, { status: 500 });
    }
  }

  if (action === 'token') {
    try {
      const { error, adminId } = await resolveAdminFromRequest(request);
      if (error || !adminId) {
        return error || generateErrorResponse('Administrador nao encontrado', 401);
      }

      const rotated = await rotateAdminAccessToken(adminId);
      if (!rotated) {
        return generateErrorResponse('Administrador nao encontrado', 404);
      }

      return generateApiResponse(toTokenPayload(rotated), 'Novo token gerado com sucesso');
    } catch (error) {
      console.error('Admin token rotation error:', error);
      return generateErrorResponse('Erro ao gerar novo token administrativo', 500);
    }
  }

  return generateErrorResponse('Rota nao encontrada', 404);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { action?: string[] } }
) {
  const action = getAction(params);

  try {
    const { error, adminId } = await resolveAdminFromRequest(request);
    if (error || !adminId) {
      return error || generateErrorResponse('Administrador nao encontrado', 401);
    }

    if (action === 'me') {
      const { data: admin, error: adminError } = await supabaseAdmin
        .from('admin_users')
        .select('id, email, full_name, is_active')
        .eq('id', adminId)
        .maybeSingle();

      if (adminError) {
        console.error('Admin me error:', adminError);
        return generateErrorResponse('Erro ao validar sessao', 500);
      }

      if (!admin || !admin.is_active) {
        return generateErrorResponse('Administrador nao encontrado', 401);
      }

      return generateApiResponse(toAdminPayload(admin));
    }

    if (action === 'token') {
      const snapshot = await getAdminTokenSnapshot(adminId);
      if (!snapshot) {
        return generateErrorResponse('Administrador nao encontrado', 404);
      }

      return generateApiResponse(toTokenPayload(snapshot));
    }
  } catch (error) {
    console.error('Admin route error:', error);
    return generateErrorResponse('Erro ao processar requisicao administrativa', 500);
  }

  return generateErrorResponse('Rota nao encontrada', 404);
}
