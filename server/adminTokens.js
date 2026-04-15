import { randomBytes } from 'node:crypto';
import { supabaseAdmin } from './supabase.js';

const ADMIN_TOKEN_BYTES = 24;

const toAdminToken = () => `drjadm_${randomBytes(ADMIN_TOKEN_BYTES).toString('hex')}`;

const toAdminRow = (admin) => ({
  id: admin.id,
  email: admin.email,
  fullName: admin.full_name || 'Administrador',
  isActive: Boolean(admin.is_active),
  token: admin.access_token || '',
  tokenCreatedAt: admin.access_token_created_at || null
});

export async function findAdminByAccessToken(token) {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, full_name, is_active, access_token, access_token_created_at')
    .eq('access_token', token)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || !data.is_active) {
    return null;
  }

  return toAdminRow(data);
}

export async function ensureAdminAccessToken(admin) {
  if (admin.access_token) {
    return {
      token: admin.access_token,
      tokenCreatedAt: admin.access_token_created_at || null
    };
  }

  return rotateAdminAccessToken(admin.id);
}

export async function rotateAdminAccessToken(adminId) {
  const accessToken = toAdminToken();
  const accessTokenCreatedAt = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .update({
      access_token: accessToken,
      access_token_created_at: accessTokenCreatedAt,
      updated_at: accessTokenCreatedAt
    })
    .eq('id', adminId)
    .select('id, email, full_name, is_active, access_token, access_token_created_at')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || !data.is_active) {
    return null;
  }

  return {
    token: data.access_token,
    tokenCreatedAt: data.access_token_created_at || null,
    admin: toAdminRow(data)
  };
}

export async function getAdminTokenSnapshot(adminId) {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, email, full_name, is_active, access_token, access_token_created_at')
    .eq('id', adminId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || !data.is_active) {
    return null;
  }

  if (!data.access_token) {
    const rotated = await rotateAdminAccessToken(adminId);
    if (!rotated) {
      return null;
    }

    return {
      ...rotated.admin,
      token: rotated.token,
      tokenCreatedAt: rotated.tokenCreatedAt
    };
  }

  return toAdminRow(data);
}
