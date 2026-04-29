import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { mapAppointmentRow } from '@/lib/database';
import { supabaseAdmin } from '@/lib/supabase';
import {
  appointmentCreateSchema,
  appointmentUpdateSchema,
  statusUpdateSchema
} from '@/lib/validations';

const getSegments = (params: { segments?: string[] }) => params.segments || [];
const isBlockedAppointment = (notes?: string | null) => Boolean(notes?.startsWith('[BLOCKED_SLOT]'));

export async function GET(
  request: NextRequest,
  { params }: { params: { segments?: string[] } }
) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  const segments = getSegments(params);

  if (segments.length === 1) {
    const appointmentId = segments[0];
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
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

  if (segments.length > 0) {
    return generateErrorResponse('Rota nao encontrada', 404);
  }

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

export async function POST(
  request: NextRequest,
  { params }: { params: { segments?: string[] } }
) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  if (getSegments(params).length > 0) {
    return generateErrorResponse('Rota nao encontrada', 404);
  }

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { segments?: string[] } }
) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  const segments = getSegments(params);
  const appointmentId = segments[0];

  if (segments.length !== 1 || !appointmentId) {
    return generateErrorResponse('Rota nao encontrada', 404);
  }

  try {
    const body = await request.json();
    const validation = appointmentUpdateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    const isMissed = body.status === 'missed'
    const dbStatus = isMissed ? 'cancelled' : (body.status ?? undefined)
    const dbNotes = isMissed
      ? `[FALTOU]${body.notes ? ' ' + body.notes : ''}`
      : (body.notes ?? null)
    const payload = {
      patient_id: body.patientId,
      date: body.date,
      time: body.time,
      type: body.type,
      status: dbStatus,
      notes: dbNotes,
      updated_at: new Date().toISOString()
    };

    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update(cleanedPayload)
      .eq('id', appointmentId)
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { segments?: string[] } }
) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  const segments = getSegments(params);
  const appointmentId = segments[0];

  if (segments.length !== 2 || !appointmentId || segments[1] !== 'status') {
    return generateErrorResponse('Rota nao encontrada', 404);
  }

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
      .eq('id', appointmentId)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { segments?: string[] } }
) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  const segments = getSegments(params);
  const appointmentId = segments[0];

  if (segments.length !== 1 || !appointmentId) {
    return generateErrorResponse('Rota nao encontrada', 404);
  }

  const { searchParams } = new URL(request.url);
  const permanent = searchParams.get('permanent') === 'true';

  const { data: appointment, error } = await supabaseAdmin
    .from('appointments')
    .select('id, notes')
    .eq('id', appointmentId)
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
      .eq('id', appointmentId);

    if (deleteError) {
      console.error('Delete appointment error:', deleteError);
      return generateErrorResponse('Erro ao excluir bloqueio', 500);
    }

    return generateApiResponse({ id: appointmentId }, 'Bloqueio excluido com sucesso');
  }

  const { error: updateError } = await supabaseAdmin
    .from('appointments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('Cancel appointment error:', updateError);
    return generateErrorResponse('Erro ao cancelar agendamento', 500);
  }

  return generateApiResponse({ id: appointmentId }, 'Agendamento cancelado com sucesso');
}
