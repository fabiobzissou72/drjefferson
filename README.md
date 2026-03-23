# 🏥 Dr. Jefferson - Sistema de Agendamento Médico

Sistema completo com frontend React e API Next.js.

## 📁 Estrutura do Projeto

```
drJefferson/
├── src/                 # Frontend React (Vite)
│   ├── components/     # Componentes React
│   ├── App.jsx          # Componente principal
│   └── main.jsx         # Entry point
├── api/                 # Backend API (Next.js)
│   ├── src/
│   │   ├── app/         # Rotas da API
│   │   │   ├── api/auth/token/      # Autenticação
│   │   │   ├── api/patients/         # CRUD Pacientes
│   │   │   └── api/appointments/     # CRUD Agendamentos
│   │   ├── lib/         # Utilitários
│   │   └── types/       # Tipos TypeScript
│   └── supabase/        # Scripts SQL
└── README.md            # Este arquivo
```

## 🚀 Como Rodar

### Frontend (React + Vite)
```bash
npm install
npm run dev
```
Acesse: http://localhost:3000

### Backend (Next.js API)
```bash
cd api
npm install
npm run dev
```
Acesse: http://localhost:3001/api/docs

## 📚 Documentação da API

Acesse: http://localhost:3001/api/docs

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/token` | Gerar token JWT |
| GET | `/api/patients` | Listar pacientes |
| POST | `/api/patients` | Criar paciente |
| GET | `/api/patients/:id` | Buscar paciente |
| PUT | `/api/patients/:id` | Editar paciente |
| DELETE | `/api/patients/:id` | Deletar paciente |
| GET | `/api/appointments` | Listar agendamentos |
| POST | `/api/appointments` | Criar agendamento |
| PATCH | `/api/appointments/:id/status` | Status (confirmou/faltou) |
| DELETE | `/api/appointments/:id` | Cancelar |

### Autenticação

```bash
# Gerar token
curl -X POST http://localhost:3001/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "drjefferson-api-token-2024"}'

# Usar token
curl http://localhost:3001/api/patients \
  -H "Authorization: Bearer <token>"
```

## 🔧 Configuração

### Variáveis de Ambiente (API)

Edite `api/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=chave-anon
JWT_SECRET=seu-secret-super-secreto
API_TOKEN=seu-token-de-acesso
```

### Banco de Dados (Supabase)

1. Crie projeto em https://supabase.com
2. Execute o script em `api/supabase/migrations/001_initial_schema.sql`

## 🚢 Deploy na Vercel

### Frontend
```bash
vercel
```

### Backend
```bash
cd api
vercel
```

## 📱 Integrações

### n8n
Consulte `api/n8n/workflows.md` para automações
