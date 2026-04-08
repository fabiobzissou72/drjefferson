import { mapPatientInput, mapPatientRow } from '../server/database.js';
import { authMiddleware, parseJsonBody, sendError, sendSuccess } from '../server/http.js';
import { supabaseAdmin } from '../server/supabase.js';
import { patientCreateSchema } from '../server/validations.js';

export default async function handler(request, response) {
  if (!authMiddleware(request, response)) {
    return;
  }

  if (request.method === 'GET') {
    try {
      const query = String(request.query.query || '').trim();
      const name = String(request.query.name || '').trim();
      const cpf = String(request.query.cpf || '').trim();
      const phone = String(request.query.phone || '').trim();
      const page = parseInt(String(request.query.page || '1'), 10);
      const pageSize = parseInt(String(request.query.pageSize || '20'), 10);

      let dbQuery = supabaseAdmin
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (cpf) {
        dbQuery = dbQuery.eq('cpf', cpf);
      } else if (phone) {
        dbQuery = dbQuery.ilike('phone', `%${phone.replace(/\D/g, '')}%`);
      } else {
        const searchTerm = name || query;
        if (searchTerm) {
          const escaped = searchTerm.replace(/[%_]/g, '');
          dbQuery = dbQuery.or(`name.ilike.%${escaped}%,cpf.ilike.%${escaped}%,phone.ilike.%${escaped}%`);
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await dbQuery.range(from, to);

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
      console.error('Search clients error:', error);
      return sendError(response, 'Erro ao buscar clientes', 500);
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
        return sendError(response, 'Ja existe um cliente com este CPF', 409);
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

      return sendSuccess(response, mapPatientRow(patient), 'Cliente criado com sucesso', 201);
    } catch (error) {
      console.error('Create client error:', error);
      return sendError(response, 'Erro ao criar cliente', 500);
    }
  }

  response.setHeader('Allow', 'GET, POST');
  return sendError(response, 'Metodo nao permitido', 405);
}
