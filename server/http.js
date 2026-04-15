import { extractToken, verifyToken } from './auth.js';
import { findAdminByAccessToken } from './adminTokens.js';

const readEnv = (name) => {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
};

export function sendJson(response, status, payload) {
  response.status(status).json(payload);
}

export function sendSuccess(response, data, message, status = 200) {
  sendJson(response, status, {
    success: true,
    data,
    message
  });
}

export function sendError(response, error, status = 400) {
  sendJson(response, status, {
    success: false,
    error
  });
}

export async function authMiddleware(request, response) {
  const token = extractToken(request.headers.authorization || request.headers.Authorization || null);

  if (!token) {
    sendError(response, 'Token de autenticacao nao fornecido', 401);
    return false;
  }

  const apiToken = readEnv('API_TOKEN');
  if (token === apiToken) {
    return true;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    try {
      const admin = await findAdminByAccessToken(token);
      if (admin) {
        request.auth = {
          userId: admin.id,
          type: 'admin',
          email: admin.email
        };
        return true;
      }
    } catch (error) {
      console.error('Admin fixed token auth error:', error);
      sendError(response, 'Erro ao validar token administrativo', 500);
      return false;
    }

    sendError(response, 'Token invalido ou expirado', 401);
    return false;
  }

  request.auth = decoded;
  return true;
}

export async function parseJsonBody(request) {
  try {
    const parseJsonString = (value) => {
      if (typeof value !== 'string') {
        return {};
      }

      const trimmed = value.trim();
      if (!trimmed) {
        return {};
      }

      try {
        return JSON.parse(trimmed);
      } catch {
        return {};
      }
    };

    if (Buffer.isBuffer(request.body)) {
      return parseJsonString(request.body.toString('utf8'));
    }

    if (typeof request.body === 'string') {
      return parseJsonString(request.body);
    }

    if (request.body && typeof request.body === 'object') {
      return request.body;
    }

    if (typeof request.on === 'function') {
      const rawBody = await new Promise((resolve) => {
        const chunks = [];

        request.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        });

        request.on('end', () => {
          resolve(Buffer.concat(chunks).toString('utf8'));
        });

        request.on('error', () => {
          resolve('');
        });
      });

      return parseJsonString(rawBody);
    }

    return {};
  } catch {
    return {};
  }
}
