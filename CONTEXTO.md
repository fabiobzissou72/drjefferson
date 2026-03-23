# 🏥 Dr. Jefferson - Contexto do Projeto

## Status Atual
**Data:** 21/03/2026
**Pasta:** `C:\Users\fbzis\Downloads\drJefferson`

## O que foi criado

### 1. Frontend React (Vite)
- **Local:** `C:\Users\fbzis\Downloads\drJefferson\src\`
- **Porta:** 3000 (rodando)
- **Features:**
  - Dashboard com calendário FullCalendar
  - CRUD de Pacientes (lista, criar, editar, deletar)
  - Sistema de Agendamentos (criar, editar, reagendar, cancelar)
  - Status: Agendado, Confirmado, Compareceu, Faltou, Cancelado
  - Design moderno com glassmorphism
  - 100% responsivo
  - Em português Brasil
- **Rodar:** `npm run dev`

### 2. Backend API (Next.js)
- **Local:** `C:\Users\fbzis\Downloads\drJefferson\api\`
- **Porta:** 3005 (rodando)
- **Documentação:** http://localhost:3005/api/docs
- **Endpoints:**
  - POST /api/auth/token - Gerar token JWT
  - GET/POST /api/patients - Listar/Criar pacientes
  - GET/PUT/DELETE /api/patients/:id - Buscar/Editar/Deletar
  - GET/POST /api/appointments - Listar/Criar agendamentos
  - GET/PUT/DELETE /api/appointments/:id - Buscar/Editar/Cancelar
  - PATCH /api/appointments/:id/status - Atualizar status
- **Rodar:** `cd api && npm run dev`

### 3. Pendências
- [ ] Conectar com Supabase (precisa das credenciais)
- [ ] Deploy na Vercel
- [ ] Configurar n8n para automações
- [ ] Conectar frontend com API

## Próximos Passos
1. Pegar credenciais do Supabase
2. Executar SQL em `api/supabase/migrations/001_initial_schema.sql`
3. Configurar variáveis de ambiente
4. Conectar frontend com API
5. Deploy

## Links Úteis
- Supabase: https://supabase.com
- Vercel: https://vercel.com
- n8n: automações

## Credenciais Placeholder (API)
```
API_TOKEN=drjefferson-api-token-2024
JWT_SECRET=drjefferson-secret-key-local-32chars-min
```
