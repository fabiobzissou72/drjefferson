import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { mapAppointmentRow } from '@/lib/database';
import { findConflictingAppointments } from '@/lib/scheduling';
import { supabaseAdmin } from '@/lib/supabase';
import { appointmentCreateSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  const authError = authMiddleware(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = appointmentCreateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', body.patientId)
      .maybeSingle();

    if (patientError) {
      throw patientError;
    }

    if (!patient) {
      return generateErrorResponse('Cliente nao encontrado', 404);
    }

    const { data: sameDayAppointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('date', body.date)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      throw appointmentsError;
    }

    const conflicts = await findConflictingAppointments({
      appointment: {
        date: body.date,
        time: body.time,
        type: body.type,
        status: 'pending'
      },
      appointments: sameDayAppointments || []
    });

    if (conflicts.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Ja existe um agendamento conflitante nesse horario',
        conflicts: conflicts.map(mapAppointmentRow)
      }, { status: 409 });
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
    console.error('Create booking error:', error);
    return generateErrorResponse('Erro ao criar agendamento', 500);
  }
}
