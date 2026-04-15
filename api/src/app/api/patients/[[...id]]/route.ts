import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { mapPatientInput, mapPatientRow } from '@/lib/database';
import { supabaseAdmin } from '@/lib/supabase';
import { patientCreateSchema, patientUpdateSchema } from '@/lib/validations';

const getPatientId = (params: { id?: string[] }) => params.id?.[0];

export async function GET(
  request: NextRequest,
  { params }: { params: { id?: string[] } }
) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  const patientId = getPatientId(params);

  if (patientId) {
    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .maybeSingle();

    if (error) {
      console.error('Get patient error:', error);
      return generateErrorResponse('Erro ao buscar paciente', 500);
    }

    if (!patient) {
      return generateErrorResponse('Paciente nao encontrado', 404);
    }

    return generateApiResponse(mapPatientRow(patient));
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  let query = supabaseAdmin
    .from('patients')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    const escapedSearch = search.replace(/[%_]/g, '');
    query = query.or(`name.ilike.%${escapedSearch}%,cpf.ilike.%${escapedSearch}%,phone.ilike.%${escapedSearch}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) {
    console.error('List patients error:', error);
    return generateErrorResponse('Erro ao listar pacientes', 500);
  }

  const patients = (data || []).map(mapPatientRow);
  const total = count || 0;

  return NextResponse.json({
    success: true,
    data: patients,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id?: string[] } }
) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  if (getPatientId(params)) {
    return generateErrorResponse('Rota nao encontrada', 404);
  }

  try {
    const body = await request.json();
    const validation = patientCreateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    const { data: existingPatient, error: existingError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('cpf', body.cpf)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingPatient) {
      return generateErrorResponse('Ja existe um paciente com este CPF', 409);
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

    return generateApiResponse(mapPatientRow(patient), 'Paciente criado com sucesso', 201);
  } catch (error) {
    console.error('Create patient error:', error);
    return generateErrorResponse('Erro ao criar paciente', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id?: string[] } }
) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  const patientId = getPatientId(params);
  if (!patientId) {
    return generateErrorResponse('Rota nao encontrada', 404);
  }

  try {
    const body = await request.json();
    const validation = patientUpdateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .update(mapPatientInput(body))
      .eq('id', patientId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!patient) {
      return generateErrorResponse('Paciente nao encontrado', 404);
    }

    return generateApiResponse(mapPatientRow(patient), 'Paciente atualizado com sucesso');
  } catch (error) {
    console.error('Update patient error:', error);
    return generateErrorResponse('Erro ao atualizar paciente', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id?: string[] } }
) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  const patientId = getPatientId(params);
  if (!patientId) {
    return generateErrorResponse('Rota nao encontrada', 404);
  }

  const { error } = await supabaseAdmin
    .from('patients')
    .delete()
    .eq('id', patientId);

  if (error) {
    console.error('Delete patient error:', error);
    return generateErrorResponse('Erro ao deletar paciente', 500);
  }

  return generateApiResponse({ id: patientId }, 'Paciente deletado com sucesso');
}
