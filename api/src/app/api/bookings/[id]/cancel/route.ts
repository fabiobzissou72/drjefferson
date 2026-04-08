import { NextRequest } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { mapAppointmentRow } from '@/lib/database';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  try {
    const bookingId = params.id;
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!appointment) {
      return generateErrorResponse('Agendamento nao encontrado', 404);
    }

    return generateApiResponse(mapAppointmentRow(appointment), 'Agendamento cancelado com sucesso');
  } catch (error) {
    console.error('Cancel booking error:', error);
    return generateErrorResponse('Erro ao cancelar agendamento', 500);
  }
}
