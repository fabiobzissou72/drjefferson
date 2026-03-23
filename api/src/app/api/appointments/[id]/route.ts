import { NextRequest } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { mapAppointmentRow } from '@/lib/database';
import { supabaseAdmin } from '@/lib/supabase';
import { appointmentUpdateSchema } from '@/lib/validations';

const isBlockedAppointment = (notes?: string | null) => {
  return Boolean(notes?.startsWith('[BLOCKED_SLOT]'));
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  const { data: appointment, error } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    console.error('Get appointment error:', error);
    return generateErrorResponse('Erro ao buscar agendamento', 500);
  }

  if (!appointment) {
    return generateErrorResponse('Agendamento nao encontrado', 404);
  }

  return generateApiResponse(mapAppointmentRow(appointment));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = appointmentUpdateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    const payload = {
      patient_id: body.patientId,
      date: body.date,
      time: body.time,
      type: body.type,
      notes: body.notes ?? null,
      updated_at: new Date().toISOString()
    };

    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update(cleanedPayload)
      .eq('id', params.id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!appointment) {
      return generateErrorResponse('Agendamento nao encontrado', 404);
    }

    return generateApiResponse(mapAppointmentRow(appointment), 'Agendamento atualizado com sucesso');
  } catch (error) {
    console.error('Update appointment error:', error);
    return generateErrorResponse('Erro ao atualizar agendamento', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const permanent = searchParams.get('permanent') === 'true';

  const { data: appointment, error } = await supabaseAdmin
    .from('appointments')
    .select('id, notes')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    console.error('Delete appointment fetch error:', error);
    return generateErrorResponse('Erro ao buscar agendamento', 500);
  }

  if (!appointment) {
    return generateErrorResponse('Agendamento nao encontrado', 404);
  }

  if (permanent) {
    if (!isBlockedAppointment(appointment.notes)) {
      return generateErrorResponse('Exclusao permanente permitida apenas para bloqueios', 400);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Delete appointment error:', deleteError);
      return generateErrorResponse('Erro ao excluir bloqueio', 500);
    }

    return generateApiResponse({ id: params.id }, 'Bloqueio excluido com sucesso');
  }

  const { error: updateError } = await supabaseAdmin
    .from('appointments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id);

  if (updateError) {
    console.error('Cancel appointment error:', updateError);
    return generateErrorResponse('Erro ao cancelar agendamento', 500);
  }

  return generateApiResponse({ id: params.id }, 'Agendamento cancelado com sucesso');
}
