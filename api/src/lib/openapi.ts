const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const successEnvelope = (schema: Record<string, unknown>, message?: string) => ({
  type: 'object',
  required: ['success', 'data'],
  properties: {
    success: { type: 'boolean', example: true },
    data: schema,
    message: { type: 'string', example: message || 'Operacao realizada com sucesso' }
  }
});

const errorResponse = { $ref: '#/components/schemas/ErrorResponse' };

const paginatedPatients = {
  type: 'object',
  required: ['success', 'data', 'total', 'page', 'pageSize', 'totalPages'],
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'array', items: ref('Patient') },
    total: { type: 'integer', example: 1 },
    page: { type: 'integer', example: 1 },
    pageSize: { type: 'integer', example: 20 },
    totalPages: { type: 'integer', example: 1 }
  }
};

const listAppointments = {
  type: 'object',
  required: ['success', 'data', 'total'],
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'array', items: ref('Appointment') },
    total: { type: 'integer', example: 1 }
  }
};

const bookingConflict = {
  type: 'object',
  required: ['success', 'error', 'conflicts'],
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'string',
      example: 'Ja existe um agendamento conflitante nesse horario'
    },
    conflicts: { type: 'array', items: ref('Appointment') }
  }
};

export function createOpenApiSpec(baseUrl: string) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Dr. Jefferson API',
      version: '1.0.0',
      description:
        'API de pacientes, agendamentos, autenticacao administrativa e automacao para agentes e n8n.'
    },
    servers: [{ url: baseUrl, description: 'Ambiente atual' }],
    tags: [
      { name: 'Auth' },
      { name: 'Admin' },
      { name: 'Patients' },
      { name: 'Appointments' },
      { name: 'Consultation Types' },
      { name: 'Automation' },
      { name: 'Plans' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Aceita JWT emitido por /api/auth/token ou o API token tecnico direto no header Authorization.'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Erro na requisicao' }
          }
        },
        ApiKeyRequest: {
          type: 'object',
          required: ['apiKey'],
          properties: {
            apiKey: { type: 'string', example: 'drjefferson-api-token-2024' }
          }
        },
        TokenData: {
          type: 'object',
          required: ['token', 'expiresIn', 'type'],
          properties: {
            token: { type: 'string' },
            expiresIn: { type: 'string', example: '7d' },
            type: { type: 'string', example: 'Bearer' }
          }
        },
        AdminLoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@drjefferson.com.br' },
            password: { type: 'string', format: 'password', example: 'senhaforte123' }
          }
        },
        AdminUser: {
          type: 'object',
          required: ['id', 'email'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            fullName: { type: 'string', example: 'Dr. Jefferson' }
          }
        },
        Patient: {
          type: 'object',
          required: ['id', 'name', 'cpf', 'phone', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Fabio Zissou' },
            cpf: { type: 'string', example: '125.334.238-58' },
            phone: { type: 'string', example: '(11) 97030-7000' },
            email: { type: 'string', format: 'email', nullable: true },
            birthDate: { type: 'string', format: 'date', nullable: true },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        PatientCreateInput: {
          type: 'object',
          required: ['name', 'cpf', 'phone'],
          properties: {
            name: { type: 'string', example: 'Fabio Zissou' },
            cpf: { type: 'string', example: '125.334.238-58' },
            phone: { type: 'string', example: '(11) 97030-7000' },
            email: { type: 'string', format: 'email' },
            birthDate: { type: 'string', format: 'date' },
            notes: { type: 'string' }
          }
        },
        PatientUpdateInput: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            cpf: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            birthDate: { type: 'string', format: 'date' },
            notes: { type: 'string' }
          }
        },
        Appointment: {
          type: 'object',
          required: ['id', 'patientId', 'date', 'time', 'type', 'status', 'createdAt', 'updatedAt'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            patientId: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date', example: '2026-04-10' },
            time: { type: 'string', example: '09:00' },
            type: {
              type: 'string',
              enum: ['first', 'checkup', 'return', 'emergency']
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'completed', 'missed', 'cancelled']
            },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AppointmentCreateInput: {
          type: 'object',
          required: ['patientId', 'date', 'time', 'type'],
          properties: {
            patientId: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date' },
            time: { type: 'string', example: '09:00' },
            type: {
              type: 'string',
              enum: ['first', 'checkup', 'return', 'emergency']
            },
            notes: { type: 'string' }
          }
        },
        AppointmentUpdateInput: {
          type: 'object',
          properties: {
            patientId: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date' },
            time: { type: 'string', example: '10:30' },
            type: {
              type: 'string',
              enum: ['first', 'checkup', 'return', 'emergency']
            },
            notes: { type: 'string' }
          }
        },
        StatusUpdateInput: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'completed', 'missed', 'cancelled']
            }
          }
        },
        ConsultationTypeConfig: {
          type: 'object',
          required: ['id', 'value', 'label', 'mode', 'durationMinutes', 'price', 'active'],
          properties: {
            id: { type: 'string' },
            value: {
              type: 'string',
              enum: ['first', 'checkup', 'return', 'emergency']
            },
            label: { type: 'string' },
            mode: {
              type: 'string',
              enum: ['presential', 'online', 'mixed']
            },
            durationMinutes: { type: 'integer', example: 90 },
            price: { type: 'number', format: 'float', example: 0 },
            active: { type: 'boolean', example: true }
          }
        },
        AvailabilityConflict: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            time: { type: 'string', example: '09:00' },
            type: { type: 'string', example: 'first' },
            status: { type: 'string', example: 'pending' },
            patientId: { type: 'string', format: 'uuid' }
          }
        },
        AvailabilitySlot: {
          type: 'object',
          required: ['time', 'available', 'conflictCount', 'conflicts'],
          properties: {
            time: { type: 'string', example: '09:00' },
            available: { type: 'boolean', example: true },
            conflictCount: { type: 'integer', example: 0 },
            conflicts: { type: 'array', items: ref('AvailabilityConflict') }
          }
        },
        PatientPlan: {
          type: 'object',
          required: ['id', 'patientName', 'planType', 'status'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            patientName: { type: 'string', example: 'Kliximy de Jesus Sousa' },
            phone: { type: 'string', example: '558681689100', nullable: true },
            planType: {
              type: 'string',
              enum: ['trimestral_misto', 'trimestral_presencial', 'mounjaro', 'concluido', 'avulsa'],
              example: 'trimestral_misto'
            },
            planName: { type: 'string', example: 'Plano Trimestral - Mista', nullable: true },
            startDate: { type: 'string', format: 'date', nullable: true },
            secondConsultDate: { type: 'string', format: 'date', nullable: true },
            lastConsultDate: { type: 'string', format: 'date', nullable: true },
            endDate: { type: 'string', format: 'date', nullable: true },
            city: { type: 'string', example: 'Teresina', nullable: true },
            scheduledNext: { type: 'boolean', example: false },
            observation: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['active', 'completed'], example: 'active' },
            sheetSource: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AvailabilityResponse: {
          type: 'object',
          required: ['date', 'type', 'durationMinutes', 'slots'],
          properties: {
            date: { type: 'string', format: 'date' },
            type: {
              type: 'string',
              enum: ['first', 'checkup', 'return', 'emergency']
            },
            durationMinutes: { type: 'integer', example: 90 },
            slots: { type: 'array', items: ref('AvailabilitySlot') }
          }
        }
      }
    },
    paths: {
      '/api/auth/token': {
        post: {
          tags: ['Auth'],
          summary: 'Gera token tecnico',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref('ApiKeyRequest') } }
          },
          responses: {
            '200': {
              description: 'Token gerado',
              content: {
                'application/json': {
                  schema: successEnvelope(ref('TokenData'), 'Token gerado com sucesso')
                }
              }
            },
            '400': { description: 'Body invalido', content: { 'application/json': { schema: errorResponse } } },
            '401': { description: 'API key invalida', content: { 'application/json': { schema: errorResponse } } }
          }
        }
      },
      '/api/admin/login': {
        post: {
          tags: ['Admin'],
          summary: 'Autentica administrador',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref('AdminLoginRequest') } }
          },
          responses: {
            '200': {
              description: 'Login realizado',
              content: {
                'application/json': {
                  schema: successEnvelope({
                    type: 'object',
                    required: ['token', 'admin'],
                    properties: {
                      token: { type: 'string' },
                      admin: ref('AdminUser')
                    }
                  }, 'Login realizado com sucesso')
                }
              }
            },
            '400': { description: 'Body invalido', content: { 'application/json': { schema: errorResponse } } },
            '401': { description: 'Credenciais invalidas', content: { 'application/json': { schema: errorResponse } } }
          }
        }
      },
      '/api/admin/me': {
        get: {
          tags: ['Admin'],
          summary: 'Valida a sessao do administrador',
          security: [{ BearerAuth: [] }],
          responses: {
            '200': {
              description: 'Sessao valida',
              content: { 'application/json': { schema: successEnvelope(ref('AdminUser')) } }
            },
            '401': { description: 'Token invalido', content: { 'application/json': { schema: errorResponse } } }
          }
        }
      },
      '/api/patients': {
        get: {
          tags: ['Patients'],
          summary: 'Lista pacientes',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } }
          ],
          responses: {
            '200': {
              description: 'Lista paginada',
              content: { 'application/json': { schema: paginatedPatients } }
            }
          }
        },
        post: {
          tags: ['Patients'],
          summary: 'Cria paciente',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref('PatientCreateInput') } }
          },
          responses: {
            '201': {
              description: 'Paciente criado',
              content: {
                'application/json': {
                  schema: successEnvelope(ref('Patient'), 'Paciente criado com sucesso')
                }
              }
            },
            '409': { description: 'CPF duplicado', content: { 'application/json': { schema: errorResponse } } }
          }
        }
      },
      '/api/patients/{id}': {
        get: {
          tags: ['Patients'],
          summary: 'Busca paciente por id',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            '200': { description: 'Paciente encontrado', content: { 'application/json': { schema: successEnvelope(ref('Patient')) } } },
            '404': { description: 'Paciente nao encontrado', content: { 'application/json': { schema: errorResponse } } }
          }
        },
        put: {
          tags: ['Patients'],
          summary: 'Atualiza paciente',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref('PatientUpdateInput') } }
          },
          responses: {
            '200': { description: 'Paciente atualizado', content: { 'application/json': { schema: successEnvelope(ref('Patient'), 'Paciente atualizado com sucesso') } } }
          }
        },
        delete: {
          tags: ['Patients'],
          summary: 'Deleta paciente',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            '200': {
              description: 'Paciente removido',
              content: {
                'application/json': {
                  schema: successEnvelope({
                    type: 'object',
                    properties: { id: { type: 'string', format: 'uuid' } }
                  }, 'Paciente deletado com sucesso')
                }
              }
            }
          }
        }
      },
      '/api/appointments': {
        get: {
          tags: ['Appointments'],
          summary: 'Lista agendamentos',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'missed', 'cancelled'] } },
            { name: 'patientId', in: 'query', schema: { type: 'string', format: 'uuid' } }
          ],
          responses: {
            '200': {
              description: 'Lista de agendamentos',
              content: { 'application/json': { schema: listAppointments } }
            }
          }
        },
        post: {
          tags: ['Appointments'],
          summary: 'Cria agendamento',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref('AppointmentCreateInput') } }
          },
          responses: {
            '201': { description: 'Agendamento criado', content: { 'application/json': { schema: successEnvelope(ref('Appointment'), 'Agendamento criado com sucesso') } } }
          }
        }
      },
      '/api/appointments/{id}': {
        get: {
          tags: ['Appointments'],
          summary: 'Busca agendamento por id',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            '200': { description: 'Agendamento encontrado', content: { 'application/json': { schema: successEnvelope(ref('Appointment')) } } },
            '404': { description: 'Agendamento nao encontrado', content: { 'application/json': { schema: errorResponse } } }
          }
        },
        put: {
          tags: ['Appointments'],
          summary: 'Atualiza agendamento',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref('AppointmentUpdateInput') } }
          },
          responses: {
            '200': { description: 'Agendamento atualizado', content: { 'application/json': { schema: successEnvelope(ref('Appointment'), 'Agendamento atualizado com sucesso') } } }
          }
        },
        delete: {
          tags: ['Appointments'],
          summary: 'Cancela agendamento ou exclui bloqueio',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
            { name: 'permanent', in: 'query', schema: { type: 'boolean', default: false } }
          ],
          responses: {
            '200': {
              description: 'Agendamento processado',
              content: {
                'application/json': {
                  schema: successEnvelope({
                    type: 'object',
                    properties: { id: { type: 'string', format: 'uuid' } }
                  })
                }
              }
            }
          }
        }
      },
      '/api/appointments/{id}/status': {
        patch: {
          tags: ['Appointments'],
          summary: 'Atualiza status do agendamento',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref('StatusUpdateInput') } }
          },
          responses: {
            '200': { description: 'Status atualizado', content: { 'application/json': { schema: successEnvelope(ref('Appointment')) } } }
          }
        }
      },
      '/api/consultation-types': {
        get: {
          tags: ['Consultation Types'],
          summary: 'Lista tipos de consulta',
          responses: {
            '200': {
              description: 'Tipos retornados',
              content: {
                'application/json': {
                  schema: successEnvelope({ type: 'array', items: ref('ConsultationTypeConfig') })
                }
              }
            }
          }
        },
        put: {
          tags: ['Consultation Types'],
          summary: 'Atualiza tipos de consulta',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'array', items: ref('ConsultationTypeConfig') }
              }
            }
          },
          responses: {
            '200': {
              description: 'Tipos atualizados',
              content: {
                'application/json': {
                  schema: successEnvelope({ type: 'array', items: ref('ConsultationTypeConfig') })
                }
              }
            }
          }
        }
      },
      '/api/clients': {
        get: {
          tags: ['Automation'],
          summary: 'Busca clientes para automacao',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'cpf', in: 'query', schema: { type: 'string' } },
            { name: 'phone', in: 'query', schema: { type: 'string' } },
            { name: 'name', in: 'query', schema: { type: 'string' } },
            { name: 'query', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } }
          ],
          responses: {
            '200': { description: 'Clientes encontrados', content: { 'application/json': { schema: paginatedPatients } } }
          }
        },
        post: {
          tags: ['Automation'],
          summary: 'Cria cliente simplificado',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref('PatientCreateInput') } }
          },
          responses: {
            '201': { description: 'Cliente criado', content: { 'application/json': { schema: successEnvelope(ref('Patient'), 'Cliente criado com sucesso') } } },
            '409': {
              description: 'CPF ou telefone ja cadastrado. Retorna existingId e existingName se for duplicata de telefone.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: false },
                      message: { type: 'string', example: 'Ja existe um cliente com este telefone' },
                      existingId: { type: 'string', format: 'uuid' },
                      existingName: { type: 'string', example: 'Fabio Zissou' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/availability': {
        get: {
          tags: ['Automation'],
          summary: 'Consulta horarios disponiveis',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'date', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['first', 'checkup', 'return', 'emergency'], default: 'first' } }
          ],
          responses: {
            '200': {
              description: 'Disponibilidade',
              content: {
                'application/json': {
                  schema: successEnvelope(ref('AvailabilityResponse'), 'Horarios consultados com sucesso')
                }
              }
            }
          }
        }
      },
      '/api/bookings': {
        post: {
          tags: ['Automation'],
          summary: 'Cria agendamento com validacao de conflito',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref('AppointmentCreateInput') } }
          },
          responses: {
            '201': { description: 'Agendamento criado', content: { 'application/json': { schema: successEnvelope(ref('Appointment'), 'Agendamento criado com sucesso') } } },
            '409': { description: 'Conflito de horario', content: { 'application/json': { schema: bookingConflict } } }
          }
        }
      },
      '/api/bookings/{id}/reschedule': {
        post: {
          tags: ['Automation'],
          summary: 'Reagenda com validacao de conflito',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref('AppointmentUpdateInput') } }
          },
          responses: {
            '200': { description: 'Agendamento reagendado', content: { 'application/json': { schema: successEnvelope(ref('Appointment'), 'Agendamento reagendado com sucesso') } } },
            '409': { description: 'Conflito de horario', content: { 'application/json': { schema: bookingConflict } } }
          }
        }
      },
      '/api/patient-plans': {
        get: {
          tags: ['Plans'],
          summary: 'Busca planos dos pacientes',
          description: 'Retorna os planos/contratos dos pacientes. Usado pelo agente de IA para consultar histórico de planos.',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'phone', in: 'query', description: 'Telefone do paciente (busca parcial)', schema: { type: 'string', example: '558681689100' } },
            { name: 'name', in: 'query', description: 'Nome do paciente (busca parcial)', schema: { type: 'string' } },
            { name: 'planType', in: 'query', description: 'Tipo de plano', schema: { type: 'string', enum: ['trimestral_misto', 'trimestral_presencial', 'mounjaro', 'concluido', 'avulsa'] } },
            { name: 'status', in: 'query', description: 'Status do plano', schema: { type: 'string', enum: ['active', 'completed'] } }
          ],
          responses: {
            '200': {
              description: 'Planos encontrados',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['success', 'data', 'total'],
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'array', items: ref('PatientPlan') },
                      total: { type: 'integer', example: 1 }
                    }
                  }
                }
              }
            },
            '401': { description: 'Nao autorizado', content: { 'application/json': { schema: errorResponse } } }
          }
        }
      },
      '/api/bookings/{id}/cancel': {
        post: {
          tags: ['Automation'],
          summary: 'Cancela agendamento simplificado',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            '200': { description: 'Agendamento cancelado', content: { 'application/json': { schema: successEnvelope(ref('Appointment'), 'Agendamento cancelado com sucesso') } } }
          }
        }
      }
    }
  };
}
