import { NextRequest } from 'next/server';
import { authMiddleware, generateApiResponse, generateErrorResponse } from '@/lib/api';
import { defaultConsultationTypes } from '@/lib/consultation-types';
import { getConsultationTypesSetting, setConsultationTypesSetting } from '@/lib/database';
import { consultationTypesUpdateSchema } from '@/lib/validations';

export async function GET() {
  try {
    const consultationTypes = await getConsultationTypesSetting();
    return generateApiResponse(consultationTypes);
  } catch (error) {
    console.error('Get consultation types error:', error);
    return generateApiResponse(defaultConsultationTypes);
  }
}

export async function PUT(request: NextRequest) {
  const authError = await authMiddleware(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = consultationTypesUpdateSchema.safeParse(body);

    if (!validation.success) {
      return generateErrorResponse(validation.error.errors[0].message, 400);
    }

    await setConsultationTypesSetting(validation.data);

    return generateApiResponse(validation.data, 'Tipos de consulta atualizados com sucesso');
  } catch (error) {
    console.error('Update consultation types error:', error);
    return generateErrorResponse('Erro ao atualizar tipos de consulta', 500);
  }
}
