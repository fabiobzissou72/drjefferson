import { NextRequest } from 'next/server';
import { generateApiResponse, generateErrorResponse } from '@/lib/api';
import { extractToken, verifyToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  if (!token) {
    return generateErrorResponse('Token nao fornecido', 401);
  }

  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'admin') {
    return generateErrorResponse('Token invalido ou expirado', 401);
  }

  const { data: admin, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, full_name, is_active')
    .eq('id', decoded.userId)
    .maybeSingle();

  if (error) {
    console.error('Admin me error:', error);
    return generateErrorResponse('Erro ao validar sessao', 500);
  }

  if (!admin || !admin.is_active) {
    return generateErrorResponse('Administrador nao encontrado', 401);
  }

  return generateApiResponse({
    id: admin.id,
    email: admin.email,
    fullName: admin.full_name
  });
}
