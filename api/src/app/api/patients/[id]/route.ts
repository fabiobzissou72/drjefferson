import { NextRequest } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { mapPatientInput, mapPatientRow } from '@/lib/database';
import { supabaseAdmin } from '@/lib/supabase';
import { patientUpdateSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  const { data: patient, error } = await supabaseAdmin
    .from('patients')
    .select('*')
    .eq('id', params.id)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = patientUpdateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .update(mapPatientInput(body))
      .eq('id', params.id)
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
  { params }: { params: { id: string } }
) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  const { error } = await supabaseAdmin
    .from('patients')
    .delete()
    .eq('id', params.id);

  if (error) {
    console.error('Delete patient error:', error);
    return generateErrorResponse('Erro ao deletar paciente', 500);
  }

  return generateApiResponse({ id: params.id }, 'Paciente deletado com sucesso');
}
