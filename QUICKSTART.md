# ============================================
# Dr. Jefferson API - Guia de Início Rápido
# ============================================

## 1. Configurar Supabase

1. Acesse https://supabase.com e crie um projeto
2. Vá em **SQL Editor** e execute o script:
   ```
   supabase/migrations/001_initial_schema.sql
   ```

## 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o `.env.local` com suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
JWT_SECRET=sua-senha-super-secreta-minimo-32-caracteres
API_TOKEN=seu-token-de-acesso-minimo-32-caracteres
```

## 3. Instalar Dependências

```bash
npm install
```

## 4. Rodar Localmente

```bash
npm run dev
```

Acesse:
- API: http://localhost:3000/api
- Docs: http://localhost:3000/api/docs
- Home: http://localhost:3000

## 5. Testar a API

### Gerar Token
```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "seu-token-de-acesso"}'
```

### Criar Paciente
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

## 6. Deploy na Vercel

```bash
npm i -g vercel
vercel
```

Configure as variáveis de ambiente na Vercel Dashboard.

## 7. Integrar com n8n

1. No n8n, adicione as variáveis:
   - `API_URL` = URL da sua API na Vercel
   - `API_TOKEN` = Seu token de API

2. Use o cliente em `src/lib/api-client.ts`:
   ```typescript
   import { api } from '@/lib/api-client';
   
   await api.createPatient(data);
   await api.createAppointment(data);
   await api.confirmAppointment(id);
   ```

## Estrutura do Projeto

```
drjefferson-api/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/token/      # Autenticação
│   │   │   ├── patients/         # CRUD Pacientes
│   │   │   ├── appointments/     # CRUD Agendamentos
│   │   │   └── docs/            # Swagger UI
│   │   ├── page.tsx             # Página inicial
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase
│   │   ├── auth.ts             # JWT
│   │   ├── api-client.ts       # Cliente TypeScript
│   │   ├── validations.ts      # Zod schemas
│   │   └── swagger.ts          # Config Swagger
│   └── types/
│       └── index.ts            # Tipos TypeScript
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── postman/
│   └── collection.json
└── n8n/
    └── workflows.md
```

## Suporte

- 📚 Documentação: `/api/docs`
- 📧 Email: suporte@drjefferson.com
- 💬 Issues: GitHub Issues
