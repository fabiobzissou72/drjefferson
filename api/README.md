# Dr. Jefferson API

API REST para o sistema de agendamento medico.

## Configuracao

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# JWT
JWT_SECRET=seu-secret-super-secreto-minimo-32-caracteres
JWT_EXPIRES_IN=7d

# API
API_TOKEN=seu-token-de-acesso-minimo-32-caracteres
```

## Instalacao

```bash
npm install
npm run dev
```

## Endpoints

### Autenticacao
- `POST /api/auth/token` - Gerar token de acesso

### Pacientes
- `GET /api/patients` - Listar todos os pacientes
- `GET /api/patients/:id` - Buscar paciente por ID
- `POST /api/patients` - Criar novo paciente
- `PUT /api/patients/:id` - Atualizar paciente
- `DELETE /api/patients/:id` - Deletar paciente

### Agendamentos
- `GET /api/appointments` - Listar agendamentos
- `GET /api/appointments/:id` - Buscar agendamento
- `POST /api/appointments` - Criar agendamento
- `PUT /api/appointments/:id` - Atualizar ou reagendar
- `PATCH /api/appointments/:id/status` - Atualizar status
- `DELETE /api/appointments/:id` - Cancelar agendamento
- `DELETE /api/appointments/:id?permanent=true` - Excluir bloqueio em definitivo

## Regra de exclusao

- Agendamento comum deve ser cancelado com `DELETE /api/appointments/:id`.
- Bloqueio manual pode ser removido em definitivo com `DELETE /api/appointments/:id?permanent=true`.
- A exclusao permanente so e aceita para registros de bloqueio com `notes` iniciando em `[BLOCKED_SLOT]`.

## Documentacao

Acesse `/api/docs` para ver a documentacao interativa.

## Deploy

```bash
vercel
```
