import { ConsultationTypeConfig } from '@/types';

export const defaultConsultationTypes: ConsultationTypeConfig[] = [
  {
    id: 'first-visit',
    value: 'first',
    label: 'Primeira vez',
    mode: 'mixed',
    durationMinutes: 90,
    price: 0,
    active: true
  },
  {
    id: 'second-visit',
    value: 'checkup',
    label: 'Segunda vez',
    mode: 'presential',
    durationMinutes: 60,
    price: 0,
    active: true
  },
  {
    id: 'returning-client',
    value: 'return',
    label: 'Retorno se ja foi cliente',
    mode: 'presential',
    durationMinutes: 60,
    price: 0,
    active: true
  },
  {
    id: 'online-return',
    value: 'emergency',
    label: 'Retorno online',
    mode: 'online',
    durationMinutes: 30,
    price: 0,
    active: true
  }
];

export let consultationTypesStore: ConsultationTypeConfig[] = [...defaultConsultationTypes];
