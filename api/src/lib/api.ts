import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyToken } from './auth';

export function authMiddleware(request: NextRequest) {
  const token = extractToken(request.headers.get('authorization'));
  
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Token de autenticação não fornecido' },
      { status: 401 }
    );
  }

  const apiToken = process.env.API_TOKEN;
  if (token === apiToken) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json(
      { success: false, error: 'Token inválido ou expirado' },
      { status: 401 }
    );
  }

  return null;
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
