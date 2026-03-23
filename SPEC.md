# Dr. Jefferson API - Especificação Técnica

## Visão Geral

API REST completa para sistema de agendamento médico, construída com Next.js 14 e TypeScript.

## Stack Tecnológica

- **Runtime**: Next.js 14 (API Routes)
- **Linguagem**: TypeScript
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: JWT (jsonwebtoken)
- **Validação**: Zod
- **Documentação**: Swagger/OpenAPI
- **Deploy**: Vercel / Docker

## Arquitetura

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP/REST
┌──────▼──────┐
│  Next.js    │ ← API Routes (Serverless)
│  API        │
└──────┬──────┘
       │ HTTPS
┌──────▼──────┐
│  Supabase   │ ← PostgreSQL + Auth
└─────────────┘
```

## Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/token` | Gera token JWT |

**Request:**
```json
{
  "apiKey": "sua-api-key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d",
    "type": "Bearer"
  }
}
```

---

### Pacientes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/patients` | Lista pacientes |
| GET | `/api/patients/:id` | Busca paciente |
| POST | `/api/patients` | Cria paciente |
| PUT | `/api/patients/:id` | Atualiza paciente |
| DELETE | `/api/patients/:id` | Deleta paciente |

**Query Parameters (GET /patients):**
- `page` - Número da página (padrão: 1)
- `pageSize` - Itens por página (padrão: 10)
- `search` - Busca por nome, CPF ou telefone

**Request Body (POST /patients):**
```json
{
  "name": "Maria Santos",
  "cpf": "123.456.789-00",
  "phone": "(11) 98765-4321",
  "email": "maria@email.com",
  "birthDate": "1985-03-15",
  "notes": "Observações"
}
```

---

### Agendamentos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/appointments` | Lista agendamentos |
| GET | `/api/appointments/:id` | Busca agendamento |
| POST | `/api/appointments` | Cria agendamento |
| PUT | `/api/appointments/:id` | Atualiza/reagenda |
| PATCH | `/api/appointments/:id/status` | Atualiza status |
| DELETE | `/api/appointments/:id` | Cancela |

**Query Parameters (GET /appointments):**
- `page` - Número da página
- `pageSize` - Itens por página
- `date` - Filtrar por data (YYYY-MM-DD)
- `patientId` - Filtrar por paciente
- `status` - Filtrar por status
- `includePatient` - Incluir dados do paciente

**Request Body (POST /appointments):**
```json
{
  "patientId": "uuid-do-paciente",
  "date": "2024-12-20",
  "time": "14:30",
  "type": "return",
  "notes": "Retorno de exame"
}
```

**Status Options:**
- `pending` - Agendado
- `confirmed` - Confirmado
- `attended` - Compareceu
- `missed` - Faltou
- `cancelled` - Cancelado

**Type Options:**
- `first` - Primeira vez
- `return` - Retorno
- `emergency` - Emergência

---

## Autenticação

A API suporta dois métodos de autenticação:

### 1. API Key (para integrações)
```bash
curl -X GET https://api.com/api/endpoint \
  -H "X-API-Key: sua-api-key"
```

### 2. Bearer Token (JWT)
```bash
# Gerar token
curl -X POST https://api.com/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "sua-api-key"}'

# Usar token
curl -X GET https://api.com/api/endpoint \
  -H "Authorization: Bearer <token>"
```

---

## Validação

Todos os inputs são validados com Zod:

- **CPF**: Formato `000.000.000-00`
- **Telefone**: Formato `(00) 00000-0000`
- **Data**: Formato `YYYY-MM-DD`
- **Horário**: Formato `HH:mm`

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Erro de validação |
| 401 | Não autorizado |
| 404 | Não encontrado |
| 409 | Conflito (ex: CPF duplicado) |
| 500 | Erro interno |

---

## Rate Limiting

- **100 req/min** por IP
- **1000 req/hora** por token

---

## Segurança

- Row Level Security (RLS) no Supabase
- Validação de inputs com Zod
- Tokens JWT com expiração
- Headers de segurança

---

## Deploy

### Vercel (Recomendado)

```bash
npm i -g vercel
vercel
```

Variáveis de ambiente necessárias:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `API_TOKEN`

### Docker

```bash
docker-compose up -d
```

---

## Documentação Swagger

Acesse `/api/docs` para ver a documentação interativa.

---

## Integrações

### n8n

Endpoints webhook para automação:
- `/api/appointments/:id/status` (PATCH)

### Frontend React

Use o cliente TypeScript em `src/lib/api-client.ts`:

```typescript
import { api } from '@/lib/api-client';

const patient = await api.createPatient({
  name: 'Maria',
  cpf: '123.456.789-00',
  phone: '(11) 98765-4321'
});
```
