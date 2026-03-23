# Dr. Jefferson API - Especificacao Tecnica

## Visao Geral

API REST para sistema de agendamento medico, construida com Next.js 14 e TypeScript.

## Stack

- Runtime: Next.js 14
- Linguagem: TypeScript
- Banco: Supabase
- Autenticacao: JWT
- Validacao: Zod
- Documentacao: Swagger
- Deploy: Vercel ou Docker

## Endpoints

### Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/auth/token` | Gera token JWT |

Request:

```json
{
  "apiKey": "sua-api-key"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "expiresIn": "7d",
    "type": "Bearer"
  }
}
```

### Pacientes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/patients` | Lista pacientes |
| GET | `/api/patients/:id` | Busca paciente |
| POST | `/api/patients` | Cria paciente |
| PUT | `/api/patients/:id` | Atualiza paciente |
| DELETE | `/api/patients/:id` | Deleta paciente |

Query parameters de `GET /api/patients`:
- `page` - numero da pagina
- `pageSize` - itens por pagina
- `search` - busca por nome, CPF ou telefone

Request body de `POST /api/patients`:

```json
{
  "name": "Maria Santos",
  "cpf": "123.456.789-00",
  "phone": "(11) 98765-4321",
  "email": "maria@email.com",
  "birthDate": "1985-03-15",
  "notes": "Observacoes"
}
```

### Agendamentos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/appointments` | Lista agendamentos |
| GET | `/api/appointments/:id` | Busca agendamento |
| POST | `/api/appointments` | Cria agendamento |
| PUT | `/api/appointments/:id` | Atualiza ou reagenda |
| PATCH | `/api/appointments/:id/status` | Atualiza status |
| DELETE | `/api/appointments/:id` | Cancela |
| DELETE | `/api/appointments/:id?permanent=true` | Exclui bloqueio em definitivo |

Query parameters de `GET /api/appointments`:
- `date` - filtrar por data `YYYY-MM-DD`
- `patientId` - filtrar por paciente
- `status` - filtrar por status

Request body de `POST /api/appointments`:

```json
{
  "patientId": "uuid-do-paciente",
  "date": "2024-12-20",
  "time": "14:30",
  "type": "return",
  "notes": "Retorno de exame"
}
```

Status permitidos:
- `pending` - Agendado
- `confirmed` - Confirmado
- `attended` - Compareceu
- `missed` - Faltou
- `cancelled` - Cancelado

Tipos permitidos:
- `first` - Primeira vez
- `return` - Retorno
- `emergency` - Emergencia

## Regra de exclusao

- `DELETE /api/appointments/:id` faz cancelamento logico e preserva o registro.
- `DELETE /api/appointments/:id?permanent=true` remove o registro em definitivo.
- Exclusao permanente e permitida apenas para bloqueios manuais com `notes` iniciando em `[BLOCKED_SLOT]`.

## Autenticacao

### API Key

```bash
curl -X GET https://api.com/api/endpoint \
  -H "X-API-Key: sua-api-key"
```

### Bearer Token

```bash
curl -X POST https://api.com/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "sua-api-key"}'
```

```bash
curl -X GET https://api.com/api/endpoint \
  -H "Authorization: Bearer <token>"
```

## Validacao

- CPF: formato `000.000.000-00`
- Telefone: formato `(00) 00000-0000`
- Data: formato `YYYY-MM-DD`
- Horario: formato `HH:mm`

## Codigos de status

| Codigo | Descricao |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Erro de validacao |
| 401 | Nao autorizado |
| 404 | Nao encontrado |
| 409 | Conflito |
| 500 | Erro interno |

## Rate limiting

- 100 req/min por IP
- 1000 req/hora por token

## Seguranca

- Row Level Security no Supabase
- Validacao com Zod
- JWT com expiracao
- Headers de seguranca

## Deploy

### Vercel

```bash
npm i -g vercel
vercel
```

Variaveis necessarias:
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

## Documentacao

Acesse `/api/docs` para ver a documentacao interativa.

## Integracoes

### n8n

- `/api/appointments/:id/status` (PATCH)
- `/api/appointments/:id?permanent=true` (DELETE, apenas para bloqueios)

### Frontend React

```typescript
import { api } from '@/lib/api-client';

const patient = await api.createPatient({
  name: 'Maria',
  cpf: '123.456.789-00',
  phone: '(11) 98765-4321'
});
```
