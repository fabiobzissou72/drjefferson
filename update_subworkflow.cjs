const https = require('https');

const N8N_COOKIE = 'n8n-auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImM0ODQwMDlkLTY4OWItNDVhMC1iMjNlLTZmOTU2MDk4MDUyMyIsImhhc2giOiJURUxuQUJmZStRIiwidXNlZE1mYSI6ZmFsc2UsImlhdCI6MTc3NjY3NzcyOCwiZXhwIjoxNzc3MjgyNTI4fQ.Wydr2KF3csHgayNqwcPepOF6SvjCmjbJqJu6G0aLaDQ';
const AUTH = 'Bearer drjefferson-api-token-2024';
const BASE = 'https://drjefferson.vercel.app/api';
const SUB_WF_ID = 'PBJvelXjl5I0Nmhu';
const PRINCIPAL_WF_ID = 'drj7rIy7Ev607B8T';

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const opts = {
      hostname: 'n8n.medwave.com.br',
      path,
      method,
      headers: { 'Content-Type': 'application/json', 'Cookie': N8N_COOKIE }
    };
    if (bodyStr) opts.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const r = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    r.on('error', reject);
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}

async function main() {
  // 1. Get sub-workflow and add buscar_planos branch
  const subResp = await req('GET', `/rest/workflows/${SUB_WF_ID}`);
  const sub = subResp.body.data;

  // Add new Switch rule for buscar_planos
  const switchNode = sub.nodes.find(n => n.name === 'Router');
  if (switchNode && switchNode.parameters?.rules?.values) {
    const alreadyHas = switchNode.parameters.rules.values.some(r =>
      r.conditions?.conditions?.[0]?.rightValue === 'buscar_planos'
    );
    if (!alreadyHas) {
      switchNode.parameters.rules.values.push({
        conditions: {
          options: { version: 2 },
          combinator: 'and',
          conditions: [{ leftValue: '={{ $json.action }}', operator: { type: 'string', operation: 'equals' }, rightValue: 'buscar_planos' }]
        },
        renameOutput: true,
        outputKey: 'buscar_planos'
      });
    }
  }

  // Add HTTP node for buscar_planos
  const alreadyHasNode = sub.nodes.some(n => n.name === 'HTTP Patient Plans');
  if (!alreadyHasNode) {
    sub.nodes.push({
      id: 'http-plans',
      name: 'HTTP Patient Plans',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [700, 1060],
      parameters: {
        method: 'GET',
        url: BASE + '/patient-plans',
        sendQuery: true,
        queryParameters: { parameters: [
          { name: 'phone', value: "={{ $json.phone || '' }}" },
          { name: 'name', value: "={{ $json.name || '' }}" },
          { name: 'planType', value: "={{ $json.planType || '' }}" },
          { name: 'status', value: "={{ $json.status || '' }}" }
        ]},
        sendHeaders: true,
        headerParameters: { parameters: [{ name: 'Authorization', value: AUTH }] },
        options: {}
      }
    });

    // Add connection Router -> HTTP Patient Plans (7th output, index 6)
    const routerConns = sub.connections['Router']?.main || [];
    while (routerConns.length < 7) routerConns.push([]);
    routerConns[6] = [{ node: 'HTTP Patient Plans', type: 'main', index: 0 }];
    sub.connections['Router'] = { main: routerConns };
  }

  // Save sub-workflow
  const saveResp = await req('PATCH', `/rest/workflows/${SUB_WF_ID}`, sub);
  console.log('Sub-workflow updated:', saveResp.status);

  // 2. Add drj_buscar_planos tool to principal workflow
  const principalResp = await req('GET', `/rest/workflows/${PRINCIPAL_WF_ID}`);
  const wf = principalResp.body.data;

  const alreadyHasTool = wf.nodes.some(n => n.name === 'drj_buscar_planos');
  if (!alreadyHasTool) {
    wf.nodes.push({
      id: 'drj-tw-plans',
      name: 'drj_buscar_planos',
      type: '@n8n/n8n-nodes-langchain.toolWorkflow',
      typeVersion: 2.2,
      position: [-1920, 900],
      parameters: {
        description: 'Busca os planos/contratos do paciente. Retorna tipo de plano, datas de início/término, status e observações. Use para saber qual plano o paciente tem ou teve.',
        workflowId: { __rl: true, value: SUB_WF_ID, mode: 'id' },
        workflowInputs: {
          mappingMode: 'defineBelow',
          value: {
            action: 'buscar_planos',
            phone: "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('phone', 'Telefone do paciente para buscar planos (opcional)', 'string') }}",
            name: "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('name', 'Nome do paciente (opcional)', 'string') }}",
            planType: "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('planType', 'Tipo de plano: trimestral_misto, trimestral_presencial, mounjaro, concluido, avulsa (opcional)', 'string') }}",
            status: "={{ /*n8n-auto-generated-fromAI-override*/ $fromAI('status', 'Status: active ou completed (opcional, padrão: todos)', 'string') }}"
          },
          matchingColumns: [],
          schema: [
            { id: 'action', displayName: 'action', required: true, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string', removed: false },
            { id: 'phone', displayName: 'phone', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string', removed: false },
            { id: 'name', displayName: 'name', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string', removed: false },
            { id: 'planType', displayName: 'planType', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string', removed: false },
            { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string', removed: false }
          ],
          attemptToConvertTypes: false,
          convertFieldsToString: false
        }
      }
    });

    // Connect to Secretaria
    wf.connections['drj_buscar_planos'] = {
      ai_tool: [[{ node: 'Secretaria', type: 'ai_tool', index: 0 }]]
    };
  }

  const updateResp = await req('PATCH', `/rest/workflows/${PRINCIPAL_WF_ID}`, wf);
  console.log('Principal workflow updated:', updateResp.status);

  if (updateResp.status === 200) {
    const tools = updateResp.body.data?.nodes?.filter(n => n.name.startsWith('drj_'));
    console.log('Total Dr Jefferson tools:', tools?.length);
    tools?.forEach(n => console.log(' -', n.name));
  }
}

main().catch(console.error);
