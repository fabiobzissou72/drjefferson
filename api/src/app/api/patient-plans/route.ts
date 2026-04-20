import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware, generateErrorResponse } from '@/lib/api';
import { supabaseAdmin } from '@/lib/supabase';

function mapPlanRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    patientName: row.patient_name,
    phone: row.phone,
    planType: row.plan_type,
    planName: row.plan_name,
    startDate: row.start_date,
    secondConsultDate: row.second_consult_date,
    lastConsultDate: row.last_consult_date,
    endDate: row.end_date,
    city: row.city,
    scheduledNext: row.scheduled_next,
    observation: row.observation,
    status: row.status,
    sheetSource: row.sheet_source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const phone = String(searchParams.get('phone') || '').trim();
    const name = String(searchParams.get('name') || '').trim();
    const planType = String(searchParams.get('planType') || '').trim();
    const status = String(searchParams.get('status') || '').trim();

    let query = supabaseAdmin
      .from('patient_plans')
      .select('*')
      .order('start_date', { ascending: false });

    if (phone) {
      const digits = phone.replace(/\D/g, '');
      query = query.ilike('phone', `%${digits}%`);
    }

    if (name) {
      query = query.ilike('patient_name', `%${name}%`);
    }

    if (planType) {
      query = query.eq('plan_type', planType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapPlanRow),
      total: (data || []).length,
    });
  } catch (error) {
    console.error('Get patient plans error:', error);
    return generateErrorResponse('Erro ao buscar planos', 500);
  }
}
