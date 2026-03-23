# ============================================
# n8n Workflows para Dr. Jefferson
# ============================================

## Workflow 1: Lembrete de Consulta (1 dia antes)

```json
{
  "name": "Lembrete de Consulta",
  "nodes": [
    {
      "name": "Scheduled Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cron",
              "expression": "0 9 * * *"
            }
          ]
        }
      }
    },
    {
      "name": "Buscar Agendamentos de Amanhã",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "={{$env.API_URL}}/appointments?date={{$vars.TOMORROW}}&includePatient=true",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "headers": {
          "Authorization": "Bearer {{$env.API_TOKEN}}"
        }
      }
    },
    {
      "name": "Enviar WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://api.whatsapp.com/v1/messages",
        "body": {
          "to": "{{$json.patient.phone}}",
          "type": "template",
          "template": {
            "name": "lembrete_consulta",
            "language": { "code": "pt_BR" },
            "components": [
              {
                "type": "body",
                "parameters": [
                  { "type": "text", "text": "{{$json.patient.name}}" },
                  { "type": "text", "text": "{{$json.time}}" }
                ]
              }
            ]
          }
        }
      }
    }
  ],
  "connections": {
    "Scheduled Trigger": { "main": [[{ "node": "Buscar Agendamentos de Amanhã" }]] },
    "Buscar Agendamentos de Amanhã": { "main": [[{ "node": "Enviar WhatsApp" }]] }
  }
}
```

## Workflow 2: Confirmar Presença

```json
{
  "name": "Confirmar Presença",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "confirm-attendance"
      }
    },
    {
      "name": "Atualizar Status",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "PATCH",
        "url": "={{$env.API_URL}}/appointments/{{$json.appointmentId}}/status",
        "body": {
          "status": "{{$json.status}}"
        }
      }
    }
  ]
}
```

## Workflow 3: Relatório Diário

```json
{
  "name": "Relatório Diário",
  "nodes": [
    {
      "name": "Scheduled Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cron",
              "expression": "0 18 * * *"
            }
          ]
        }
      }
    },
    {
      "name": "Buscar Agendamentos de Hoje",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "GET",
        "url": "={{$env.API_URL}}/appointments?date={{$vars.TODAY}}"
      }
    },
    {
      "name": "Enviar Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "to": "drjefferson@email.com",
        "subject": "=Resumo do dia {{$vars.TODAY}}",
        "html": "<h1>Resumo de Agendamentos</h1><p>Total: {{$json.total}}</p>"
      }
    }
  ]
}
```

---

## Variáveis de Ambiente n8n

```env
API_URL=https://sua-api.vercel.app/api
API_TOKEN=seu-token-de-acesso
```
