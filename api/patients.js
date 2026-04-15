import { mapPatientInput, mapPatientRow } from '../server/database.js';
import { authMiddleware, parseJsonBody, sendError, sendSuccess } from '../server/http.js';
import { supabaseAdmin } from '../server/supabase.js';
import { patientCreateSchema } from '../server/validations.js';

export default async function handler(request, response) {
  if (!await authMiddleware(request, response)) {
    return;
  }

  if (request.method === 'GET') {
    try {
      const search = String(request.query.search || '');
      const page = parseInt(String(request.query.page || '1'), 10);
      const pageSize = parseInt(String(request.query.pageSize || '10'), 10);

      let query = supabaseAdmin
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        const escapedSearch = search.replace(/[%_]/g, '');
        query = query.or(`name.ilike.%${escapedSearch}%,cpf.ilike.%${escapedSearch}%,phone.ilike.%${escapedSearch}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await query.range(from, to);

      if (error) {
        throw error;
      }

      return response.status(200).json({
        success: true,
        data: (data || []).map(mapPatientRow),
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      });
    } catch (error) {
      console.error('List patients error:', error);
      return sendError(response, 'Erro ao listar pacientes', 500);
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await parseJsonBody(request);
      const validation = patientCreateSchema.safeParse(body);

      if (!validation.success) {
        return sendError(response, validation.error.errors[0].message, 400);
      }

      const { data: existingPatient, error: existingError } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('cpf', body.cpf)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingPatient) {
        return sendError(response, 'Ja existe um paciente com este CPF', 409);
      }

      const { data: patient, error } = await supabaseAdmin
        .from('patients')
        .insert({
          ...mapPatientInput(body),
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return sendSuccess(response, mapPatientRow(patient), 'Paciente criado com sucesso', 201);
    } catch (error) {
      console.error('Create patient error:', error);
      return sendError(response, 'Erro ao criar paciente', 500);
    }
  }

  response.setHeader('Allow', 'GET, POST');
  return sendError(response, 'Metodo nao permitido', 405);
}
