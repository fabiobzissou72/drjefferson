import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { mapPatientInput, mapPatientRow } from '@/lib/database';
import { supabaseAdmin } from '@/lib/supabase';
import { patientCreateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const query = String(searchParams.get('query') || '').trim();
    const name = String(searchParams.get('name') || '').trim();
    const cpf = String(searchParams.get('cpf') || '').trim();
    const phone = String(searchParams.get('phone') || '').trim();
    const page = parseInt(String(searchParams.get('page') || '1'), 10);
    const pageSize = parseInt(String(searchParams.get('pageSize') || '20'), 10);

    let dbQuery = supabaseAdmin
      .from('patients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (cpf) {
      dbQuery = dbQuery.eq('cpf', cpf);
    } else if (phone) {
      dbQuery = dbQuery.ilike('phone', `%${phone.replace(/\D/g, '')}%`);
    } else {
      const searchTerm = name || query;
      if (searchTerm) {
        const escaped = searchTerm.replace(/[%_]/g, '');
        dbQuery = dbQuery.or(`name.ilike.%${escaped}%,cpf.ilike.%${escaped}%,phone.ilike.%${escaped}%`);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await dbQuery.range(from, to);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapPatientRow),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    });
  } catch (error) {
    console.error('Search clients error:', error);
    return generateErrorResponse('Erro ao buscar clientes', 500);
  }
}

export async function POST(request: NextRequest) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = patientCreateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    // Check CPF duplicate
    if (body.cpf) {
      const { data: byCpf, error: cpfError } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('cpf', body.cpf)
        .maybeSingle();
      if (cpfError) throw cpfError;
      if (byCpf) return generateErrorResponse('Ja existe um cliente com este CPF', 409);
    }

    // Check phone duplicate
    if (body.phone) {
      const normalizedPhone = body.phone.replace(/\D/g, '');
      const { data: byPhone, error: phoneError } = await supabaseAdmin
        .from('patients')
        .select('id, name, phone')
        .ilike('phone', `%${normalizedPhone}%`)
        .maybeSingle();
      if (phoneError) throw phoneError;
      if (byPhone) {
        return NextResponse.json(
          { success: false, message: 'Ja existe um cliente com este telefone', existingId: byPhone.id, existingName: byPhone.name },
          { status: 409 }
        );
      }
    }

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .insert({
        ...mapPatientInput(body),
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return generateApiResponse(mapPatientRow(patient), 'Cliente criado com sucesso', 201);
  } catch (error) {
    console.error('Create client error:', error);
    return generateErrorResponse('Erro ao criar cliente', 500);
  }
}
