import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { mapAppointmentRow } from '@/lib/database';
import { findConflictingAppointments } from '@/lib/scheduling';
import { supabaseAdmin } from '@/lib/supabase';
import { appointmentUpdateSchema } from '@/lib/validations';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  try {
    const bookingId = params.id;
    const body = await request.json();
    const validation = appointmentUpdateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    const { data: existingAppointment, error: existingError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existingAppointment) {
      return generateErrorResponse('Agendamento nao encontrado', 404);
    }

    const mergedAppointment = {
      patient_id: body.patientId || existingAppointment.patient_id,
      date: body.date || existingAppointment.date,
      time: body.time || existingAppointment.time,
      type: body.type || existingAppointment.type,
      notes: body.notes ?? existingAppointment.notes,
      status: existingAppointment.status
    };

    const { data: sameDayAppointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('date', mergedAppointment.date)
      .neq('status', 'cancelled');

    if (appointmentsError) {
      throw appointmentsError;
    }

    const conflicts = await findConflictingAppointments({
      appointment: {
        date: mergedAppointment.date,
        time: mergedAppointment.time,
        type: mergedAppointment.type,
        status: mergedAppointment.status
      },
      appointments: sameDayAppointments || [],
      ignoreAppointmentId: bookingId
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
      .update({
        patient_id: mergedAppointment.patient_id,
        date: mergedAppointment.date,
        time: mergedAppointment.time,
        type: mergedAppointment.type,
        notes: mergedAppointment.notes ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return generateApiResponse(mapAppointmentRow(appointment), 'Agendamento reagendado com sucesso');
  } catch (error) {
    console.error('Reschedule booking error:', error);
    return generateErrorResponse('Erro ao reagendar', 500);
  }
}
