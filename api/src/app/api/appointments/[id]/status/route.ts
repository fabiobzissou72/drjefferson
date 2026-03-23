import { NextRequest } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { mapAppointmentRow } from '@/lib/database';
import { supabaseAdmin } from '@/lib/supabase';
import { statusUpdateSchema } from '@/lib/validations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = statusUpdateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!appointment) {
      return generateErrorResponse('Agendamento nao encontrado', 404);
    }

    const statusMessages: Record<string, string> = {
      pending: 'Agendamento marcado como pendente',
      confirmed: 'Agendamento confirmado',
      completed: 'Paciente compareceu',
      missed: 'Paciente faltou',
      cancelled: 'Agendamento cancelado'
    };

    return generateApiResponse(mapAppointmentRow(appointment), statusMessages[body.status]);
  } catch (error) {
    console.error('Update status error:', error);
    return generateErrorResponse('Erro ao atualizar status', 500);
  }
}
