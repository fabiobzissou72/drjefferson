import { createOpenApiSpec } from '../server/openapi.js';

function getBaseUrl(request) {
  const forwardedProto = request.headers['x-forwarded-proto'] || 'https';
  const forwardedHost = request.headers['x-forwarded-host'] || request.headers.host;
  return `${forwardedProto}://${forwardedHost}`;
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({
      success: false,
      error: 'Metodo nao permitido'
    });
  }

  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.status(200).json(createOpenApiSpec(getBaseUrl(request)));
}
