-- Migration 004: Adicionar campos de planos, cidades e controle trimestral

-- Adicionar novos campos na tabela patients
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS city TEXT CHECK (city IN ('Parnaíba', 'Teresina')),
ADD COLUMN IF NOT EXISTS plan_type TEXT CHECK (plan_type IN ('trimestral_misto', 'trimestral_presencial', 'personalizada_presencial', 'personalizada_online')),
ADD COLUMN IF NOT EXISTS plan_start_date DATE,
ADD COLUMN IF NOT EXISTS consultation_1_date DATE,
ADD COLUMN IF NOT EXISTS consultation_2_date DATE,
ADD COLUMN IF NOT EXISTS consultation_3_date DATE,
ADD COLUMN IF NOT EXISTS protocolo_monjaro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Adicionar campo consultation_mode na tabela appointments
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS consultation_mode TEXT CHECK (consultation_mode IN ('online', 'presencial')) DEFAULT 'presencial';

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_patients_city ON public.patients(city);
CREATE INDEX IF NOT EXISTS idx_patients_plan_type ON public.patients(plan_type);
CREATE INDEX IF NOT EXISTS idx_patients_protocolo_monjaro ON public.patients(protocolo_monjaro);
CREATE INDEX IF NOT EXISTS idx_appointments_consultation_mode ON public.appointments(consultation_mode);

-- Atualizar configurações de tipos de consulta com novos planos
INSERT INTO public.app_settings (key, value)
VALUES (
  'plan_types',
  '[
    {
      "id": "trimestral_misto",
      "label": "Plano Misto Trimestral",
      "description": "1 consulta presencial + 2 consultas online",
      "price": 1097.00,
      "consultations": 3,
      "durationMonths": 3,
      "consultationTypes": [
        {"order": 1, "mode": "presencial", "durationMinutes": 90},
        {"order": 2, "mode": "online", "durationMinutes": 30},
        {"order": 3, "mode": "online", "durationMinutes": 30}
      ]
    },
    {
      "id": "trimestral_presencial",
      "label": "Plano Presencial Trimestral",
      "description": "3 consultas presenciais",
      "price": 1297.00,
      "consultations": 3,
      "durationMonths": 3,
      "consultationTypes": [
        {"order": 1, "mode": "presencial", "durationMinutes": 90},
        {"order": 2, "mode": "presencial", "durationMinutes": 60},
        {"order": 3, "mode": "presencial", "durationMinutes": 60}
      ]
    },
    {
      "id": "personalizada_presencial",
      "label": "Consulta Personalizada Presencial",
      "description": "Consulta única presencial",
      "price": 697.00,
      "consultations": 1,
      "durationMonths": 0,
      "consultationTypes": [
        {"order": 1, "mode": "presencial", "durationMinutes": 90}
      ]
    },
    {
      "id": "personalizada_online",
      "label": "Consulta Personalizada Online",
      "description": "Consulta única online",
      "price": 597.00,
      "consultations": 1,
      "durationMonths": 0,
      "consultationTypes": [
        {"order": 1, "mode": "online", "durationMinutes": 90}
      ]
    }
  ]'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = timezone('utc', now());

-- Comentários nas colunas
COMMENT ON COLUMN public.patients.city IS 'Cidade de atendimento: Parnaíba ou Teresina';
COMMENT ON COLUMN public.patients.plan_type IS 'Tipo de plano contratado pelo paciente';
COMMENT ON COLUMN public.patients.plan_start_date IS 'Data de início do plano';
COMMENT ON COLUMN public.patients.consultation_1_date IS 'Data da primeira consulta do plano';
COMMENT ON COLUMN public.patients.consultation_2_date IS 'Data da segunda consulta do plano';
COMMENT ON COLUMN public.patients.consultation_3_date IS 'Data da terceira consulta do plano';
COMMENT ON COLUMN public.patients.protocolo_monjaro IS 'Paciente está em protocolo Monjaro';
COMMENT ON COLUMN public.patients.observations IS 'Observações gerais sobre o paciente';
COMMENT ON COLUMN public.appointments.consultation_mode IS 'Modo da consulta: online ou presencial';
