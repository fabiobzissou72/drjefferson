import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { mapAppointmentRow } from '@/lib/database';
import { supabaseAdmin } from '@/lib/supabase';
import { appointmentCreateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const status = searchParams.get('status');
  const patientId = searchParams.get('patientId');

  let query = supabaseAdmin
    .from('appointments')
    .select('*')
    .order('date', { ascending: false })
    .order('time', { ascending: false });

  if (date) query = query.eq('date', date);
  if (status) query = query.eq('status', status);
  if (patientId) query = query.eq('patient_id', patientId);

  const { data, error } = await query;
  if (error) {
    console.error('List appointments error:', error);
    return generateErrorResponse('Erro ao listar agendamentos', 500);
  }

  const appointments = (data || []).map(mapAppointmentRow);

  return NextResponse.json({
    success: true,
    data: appointments,
    total: appointments.length
  });
}

export async function POST(request: NextRequest) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = appointmentCreateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id: body.patientId,
        date: body.date,
        time: body.time,
        type: body.type,
        status: 'pending',
        notes: body.notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return generateApiResponse(mapAppointmentRow(appointment), 'Agendamento criado com sucesso', 201);
  } catch (error) {
    console.error('Create appointment error:', error);
    return generateErrorResponse('Erro ao criar agendamento', 500);
  }
}
