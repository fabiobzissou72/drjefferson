import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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
      .select('id, email, full_name, password_hash, is_active')
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

    const token = generateToken({
      userId: admin.id,
      type: 'admin',
      email: admin.email
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.full_name
        }
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
