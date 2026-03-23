# Dr. Jefferson API - Guia de Inicio Rapido

## 1. Configurar Supabase

1. Acesse https://supabase.com e crie um projeto.
2. Va em SQL Editor e execute:

```text
supabase/migrations/001_initial_schema.sql
```

## 2. Configurar variaveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
JWT_SECRET=sua-senha-super-secreta-minimo-32-caracteres
API_TOKEN=seu-token-de-acesso-minimo-32-caracteres
```

## 3. Instalar dependencias

```bash
npm install
```

## 4. Rodar localmente

```bash
npm run dev
```

Acesse:
- API: `http://localhost:3000/api`
- Docs: `http://localhost:3000/api/docs`
- Home: `http://localhost:3000`

## 5. Testar a API

### Gerar token

```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "seu-token-de-acesso"}'
```

### Criar paciente

```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "X-API-Key: seu-token-de-acesso" \
  -d '{
    "name": "Maria Santos",
    "cpf": "123.456.789-00",
    "phone": "(11) 98765-4321"
  }'
```

### Excluir bloqueio em definitivo

```bash
curl -X DELETE "http://localhost:3000/api/appointments/ID-DO-BLOQUEIO?permanent=true" \
  -H "Authorization: Bearer <token>"
```

Use essa rota apenas para bloqueios manuais. Consultas normais devem ser canceladas, nao removidas em definitivo.

## 6. Deploy na Vercel

```bash
npm i -g vercel
vercel
```

## 7. Integrar com n8n

1. Configure:
- `API_URL` = URL da sua API na Vercel
- `API_TOKEN` = seu token de API

2. Use o cliente em `src/lib/api-client.ts`:

```typescript
import { api } from '@/lib/api-client';

await api.createPatient(data);
await api.createAppointment(data);
await api.confirmAppointment(id);
```

## Estrutura do projeto

```text
drjefferson-api/
|-- src/
|   |-- app/
|   |   |-- api/
|   |   |   |-- auth/token/
|   |   |   |-- patients/
|   |   |   |-- appointments/
|   |   |   `-- docs/
|   |   |-- page.tsx
|   |   `-- layout.tsx
|   |-- lib/
|   |   |-- supabase.ts
|   |   |-- auth.ts
|   |   |-- api-client.ts
|   |   |-- validations.ts
|   |   `-- swagger.ts
|   `-- types/
|       `-- index.ts
|-- supabase/
|   `-- migrations/
|       `-- 001_initial_schema.sql
|-- postman/
|   `-- collection.json
`-- n8n/
    `-- workflows.md
```
