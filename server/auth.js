import jwt from 'jsonwebtoken';

const readEnv = (name, fallback = '') => {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : fallback;
};

const JWT_SECRET = readEnv('JWT_SECRET', 'default-secret-change-me');
const rawExpiresIn = readEnv('JWT_EXPIRES_IN', '7d');
const JWT_EXPIRES_IN = /^\d+$/.test(rawExpiresIn) ? Number(rawExpiresIn) : rawExpiresIn;

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function extractToken(authHeader) {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return authHeader;
}
