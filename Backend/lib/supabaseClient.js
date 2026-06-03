import { createClient } from '@supabase/supabase-js';

const cleanEnvValue = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.replace(/^['"]|['"]$/g, '');
};

const supabaseUrl = cleanEnvValue(process.env.SUPABASE_URL);
const supabaseServiceKey = cleanEnvValue(process.env.SUPABASE_SERVICE_KEY);
const bucket = cleanEnvValue(process.env.SUPABASE_BUCKET) || 'uploads';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined and not empty');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const storageBucket = bucket;

export const uploadToStorage = async (path, fileBuffer, contentType) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileBuffer, { contentType, upsert: true });

  if (error) {
    throw new Error(`Supabase storage upload failed: ${error.message}`);
  }

  return data;
};

export const getPublicStorageUrl = (path) => {
  const { data, error } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  if (error) {
    throw new Error(`Supabase storage getPublicUrl failed: ${error.message}`);
  }

  return data.publicUrl;
};

export const getSignedStorageUrl = async (path, expiresIn = 3600) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Supabase storage createSignedUrl failed: ${error.message}`);
  }

  return data.signedUrl;
};

export const getStoragePathFromPublicUrl = (url) => {
  try {
    const parsed = new URL(url);
    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (!parsed.pathname.startsWith(prefix)) return null;
    return parsed.pathname.slice(prefix.length);
  } catch {
    return null;
  }
};

export const resolveStoragePath = (value) => {
  if (!value) return null;
  const publicPath = getStoragePathFromPublicUrl(value);
  if (publicPath) return publicPath;
  if (value.startsWith('avatars/') || value.startsWith('content/')) return value;
  return null;
};

export const deleteFromStorage = async (path) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    throw new Error(`Supabase storage remove failed: ${error.message}`);
  }
};
