import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import localProvider from '../storage/localProvider.js';
import supabaseProvider from '../storage/supabaseProvider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localUploadsRoot = path.resolve(__dirname, '../uploads');

// 7 days — refreshed whenever /auth/me or login runs
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

const cleanEnv = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim().replace(/^['"]|['"]$/g, '') || null;
};

const hasSupabaseConfig = () =>
  Boolean(
    cleanEnv(process.env.SUPABASE_URL) &&
      (cleanEnv(process.env.SUPABASE_SERVICE_KEY) ||
        cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)),
  );

const getSupabaseClient = () => {
  const url = cleanEnv(process.env.SUPABASE_URL);
  const serviceKey =
    cleanEnv(process.env.SUPABASE_SERVICE_KEY) ||
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const normalizeStoragePath = (avatarUrl) => {
  if (!avatarUrl) return '';
  return avatarUrl.startsWith('/uploads/')
    ? avatarUrl.replace(/^\/uploads\//, '')
    : avatarUrl.replace(/^\/+/, '');
};

const localFileExists = (storagePath) => {
  if (!storagePath) return false;
  try {
    return fs.existsSync(path.join(localUploadsRoot, storagePath));
  } catch {
    return false;
  }
};

/**
 * Sync resolver for non-async call sites.
 * Prefers local files; otherwise returns Supabase public URL (may 400 if bucket is private).
 */
export const resolveAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return null;

  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  const storagePath = normalizeStoragePath(avatarUrl);
  if (!storagePath) return null;

  const useLocal = process.env.LOCAL_UPLOADS?.toLowerCase() === 'true';
  if (useLocal && localFileExists(storagePath)) {
    return localProvider.resolveUrl(storagePath);
  }

  if (hasSupabaseConfig()) {
    try {
      return supabaseProvider.resolveUrl(storagePath);
    } catch {
      // ignore
    }
  }

  if (useLocal) {
    return localProvider.resolveUrl(storagePath);
  }

  return null;
};

/**
 * Async resolver — uses signed URLs for private Supabase buckets.
 */
export const resolveAvatarUrlAsync = async (avatarUrl) => {
  if (!avatarUrl) return null;

  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  const storagePath = normalizeStoragePath(avatarUrl);
  if (!storagePath) return null;

  const useLocal = process.env.LOCAL_UPLOADS?.toLowerCase() === 'true';
  if (useLocal && localFileExists(storagePath)) {
    return localProvider.resolveUrl(storagePath);
  }

  if (hasSupabaseConfig()) {
    try {
      const bucket = cleanEnv(process.env.SUPABASE_BUCKET) || 'uploads';
      const client = getSupabaseClient();
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);
      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch {
      // fall through to public URL
    }

    try {
      return supabaseProvider.resolveUrl(storagePath);
    } catch {
      // ignore
    }
  }

  if (useLocal) {
    return localProvider.resolveUrl(storagePath);
  }

  return null;
};
