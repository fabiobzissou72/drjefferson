import { NextRequest } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { buildAvailability } from '@/lib/scheduling';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const date = String(searchParams.get('date') || '').trim();
  const type = String(searchParams.get('type') || 'first').trim();

  if (!date) {
    return generateErrorResponse('Data e obrigatoria no formato YYYY-MM-DD', 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('date', date)
      .neq('status', 'cancelled')
      .order('time', { ascending: true });

    if (error) {
      throw error;
    }

    const availability = await buildAvailability(date, type, data || []);
    return generateApiResponse(availability, 'Horarios consultados com sucesso');
  } catch (error) {
    console.error('Availability error:', error);
    return generateErrorResponse('Erro ao consultar horarios', 500);
  }
}
