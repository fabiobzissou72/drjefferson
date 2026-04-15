import { randomBytes } from 'node:crypto';
import { supabaseAdmin } from './supabase';

const ADMIN_TOKEN_BYTES = 24;

const createAdminToken = () => `drjadm_${randomBytes(ADMIN_TOKEN_BYTES).toString('hex')}`;

export interface AdminTokenRecord {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  token: string;
  tokenCreatedAt: string | null;
}

const mapAdminTokenRecord = (admin: any): AdminTokenRecord => ({
  id: admin.id,
  email: admin.email,
  fullName: admin.full_name || 'Administrador',
  isActive: Boolean(admin.is_active),
  token: admin.access_token || '',
  tokenCreatedAt: admin.access_token_created_at || null
});

export async function findAdminByAccessToken(token: string) {
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

  return mapAdminTokenRecord(data);
}

export async function rotateAdminAccessToken(adminId: string) {
  const accessToken = createAdminToken();
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

  return mapAdminTokenRecord(data);
}

export async function ensureAdminAccessToken(admin: { id: string; access_token?: string | null; access_token_created_at?: string | null }) {
  if (admin.access_token) {
    return {
      token: admin.access_token,
      tokenCreatedAt: admin.access_token_created_at || null
    };
  }

  const rotated = await rotateAdminAccessToken(admin.id);
  if (!rotated) {
    return null;
  }

  return {
    token: rotated.token,
    tokenCreatedAt: rotated.tokenCreatedAt
  };
}

export async function getAdminTokenSnapshot(adminId: string) {
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
    return rotateAdminAccessToken(adminId);
  }

  return mapAdminTokenRecord(data);
}
