import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API Key é obrigatória'
      }, { status: 400 });
    }

    const validApiKey = process.env.API_TOKEN;
    if (apiKey !== validApiKey) {
      return NextResponse.json({
        success: false,
        error: 'API Key inválida'
      }, { status: 401 });
    }

    const token = generateToken({
      userId: 'api-user',
      type: 'api'
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        type: 'Bearer'
      },
      message: 'Token gerado com sucesso'
    });

  } catch (error) {
    console.error('Token error:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar token'
    }, { status: 500 });
  }
}
