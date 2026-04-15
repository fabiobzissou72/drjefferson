import { NextRequest, NextResponse } from 'next/server';
import { findAdminByAccessToken } from './admin-tokens';
import { extractToken, verifyToken } from './auth';

export async function authMiddleware(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Token de autenticacao nao fornecido' },
      { status: 401 }
    );
  }

  const apiToken = process.env.API_TOKEN;
  if (token === apiToken) {
    return null;
  }

  const decoded = verifyToken(token);
  if (decoded) {
    return null;
  }

  try {
    const admin = await findAdminByAccessToken(token);
    if (admin) {
      return null;
    }
  } catch (error) {
    console.error('Admin fixed token auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao validar token administrativo' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, error: 'Token invalido ou expirado' },
    { status: 401 }
  );
}

export function generateApiResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json({
    success: true,
    data,
    message
  }, { status });
}

export function generateErrorResponse(error: string, status = 400) {
  return NextResponse.json({
    success: false,
    error
  }, { status });
}
