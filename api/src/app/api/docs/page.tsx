const sections = [
  {
    title: 'Autenticacao',
    icon: 'KEY',
    endpoints: [
      { method: 'POST', path: '/api/auth/token', desc: 'Gera token JWT de acesso tecnico' },
      { method: 'POST', path: '/api/admin/login', desc: 'Autentica admin por email e senha' },
      { method: 'GET', path: '/api/admin/me', desc: 'Valida sessao atual do admin' }
    ]
  },
  {
    title: 'Pacientes',
    icon: 'PAT',
    endpoints: [
      { method: 'GET', path: '/api/patients', desc: 'Lista todos os pacientes' },
      { method: 'GET', path: '/api/patients/:id', desc: 'Busca paciente por ID' },
      { method: 'POST', path: '/api/patients', desc: 'Cria novo paciente' },
      { method: 'PUT', path: '/api/patients/:id', desc: 'Atualiza paciente' },
      { method: 'DELETE', path: '/api/patients/:id', desc: 'Deleta paciente' }
    ]
  },
  {
    title: 'Agendamentos',
    icon: 'APT',
    endpoints: [
      { method: 'GET', path: '/api/appointments', desc: 'Lista agendamentos' },
      { method: 'GET', path: '/api/appointments/:id', desc: 'Busca agendamento' },
      { method: 'POST', path: '/api/appointments', desc: 'Cria agendamento' },
      { method: 'PUT', path: '/api/appointments/:id', desc: 'Reagenda' },
      { method: 'PATCH', path: '/api/appointments/:id/status', desc: 'Atualiza status' },
      { method: 'DELETE', path: '/api/appointments/:id', desc: 'Cancela agendamento' },
      { method: 'DELETE', path: '/api/appointments/:id?permanent=true', desc: 'Exclui bloqueio em definitivo' }
    ]
  },
  {
    title: 'Tipos de Consulta',
    icon: 'CFG',
    endpoints: [
      { method: 'GET', path: '/api/consultation-types', desc: 'Lista os 4 tipos padrao com duracao e modalidade' },
      { method: 'PUT', path: '/api/consultation-types', desc: 'Atualiza o catalogo de tipos de consulta' }
    ]
  }
]

const methodColors: Record<string, string> = {
  GET: '#10b981',
  POST: '#2563eb',
  PUT: '#f59e0b',
  PATCH: '#7c3aed',
  DELETE: '#dc2626'
}

export default function ApiDocs() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '40px 20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#0f172a'
      }}
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '8px' }}>Dr. Jefferson API</h1>
          <p style={{ color: '#475569', fontSize: '1.05rem', maxWidth: '820px' }}>
            Documentacao resumida da API de pacientes e agendamentos. O endpoint de bloqueio permanente
            existe apenas para remover bloqueios manuais de agenda.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          {sections.map((section) => (
            <ApiSection
              key={section.title}
              title={section.title}
              icon={section.icon}
              endpoints={section.endpoints}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: '32px',
            padding: '24px',
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)'
          }}
        >
          <h2 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Como usar</h2>
          <div style={{ display: 'grid', gap: '10px', fontFamily: 'monospace', fontSize: '0.92rem' }}>
            <code style={{ color: '#2563eb' }}>1. POST /api/auth/token com {'{ "apiKey": "seu-token" }'}</code>
            <code style={{ color: '#0f172a' }}>2. Use Authorization: Bearer &lt;token&gt; nas demais rotas</code>
            <code style={{ color: '#dc2626' }}>
              3. Para excluir bloqueio manual: DELETE /api/appointments/:id?permanent=true
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApiSection({
  title,
  icon,
  endpoints
}: {
  title: string
  icon: string
  endpoints: { method: string; path: string; desc: string }[]
}) {
  return (
    <section
      style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #cbd5e1',
        overflow: 'hidden',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)'
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          background: '#eff6ff',
          borderBottom: '1px solid #dbeafe',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#dbeafe',
            color: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.8rem'
          }}
        >
          {icon}
        </div>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h2>
      </div>

      <div style={{ padding: '12px' }}>
        {endpoints.map((endpoint) => (
          <div
            key={`${endpoint.method}-${endpoint.path}`}
            style={{
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '10px',
              flexWrap: 'wrap'
            }}
          >
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                background: `${methodColors[endpoint.method]}18`,
                color: methodColors[endpoint.method],
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                fontWeight: 700,
                minWidth: '68px',
                textAlign: 'center'
              }}
            >
              {endpoint.method}
            </span>

            <code
              style={{
                color: '#334155',
                fontFamily: 'monospace',
                fontSize: '0.92rem',
                flex: 1
              }}
            >
              {endpoint.path}
            </code>

            <span style={{ color: '#64748b', fontSize: '0.88rem' }}>{endpoint.desc}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
