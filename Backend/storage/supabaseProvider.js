import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const cleanEnvValue = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.replace(/^['"]|['"]$/g, '');
};

const getSupabaseConfig = () => {
  const url = cleanEnvValue(process.env.SUPABASE_URL);
  const serviceKey = cleanEnvValue(process.env.SUPABASE_SERVICE_KEY) || cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const bucket = cleanEnvValue(process.env.SUPABASE_BUCKET) || 'uploads';

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be defined');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('SUPABASE_URL must be the full project URL, such as https://your-project.supabase.co');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
    throw new Error('SUPABASE_URL must be a valid HTTP or HTTPS project URL');
  }

  return {
    url: parsedUrl.origin,
    serviceKey,
    bucket,
    anonKey: cleanEnvValue(process.env.SUPABASE_ANON_KEY) || cleanEnvValue(process.env.SUPABASE_PUBLISHABLE_KEY),
  };
};

const getClient = () => {
  const { url, serviceKey } = getSupabaseConfig();
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const normalizeDestination = (destination = '') => (destination || '').replace(/^\/+|\/+$/g, '');

const getFileBuffer = async (file) => {
  if (file.buffer) return file.buffer;
  if (file.path) return fs.readFile(file.path);
  throw new Error('Unsupported file input for Supabase storage');
};

const supabaseProvider = {
  /**
   * Stores a file in the configured Supabase bucket.
   *
   * @param {object} file - Multer file object.
   * @param {string} destination - Relative destination path, for example: 'content' or 'avatars'.
   * @returns {Promise<string>} Relative storage path that can be persisted in the database.
   */
  async upload(file, destination = '') {
    const { bucket } = getSupabaseConfig();
    const client = getClient();

    const normalizedDestination = normalizeDestination(destination);
    const extension = path.extname(file.originalname || file.name || '').toLowerCase();
    const filename = `${file.filename || `${Date.now()}-${Math.random().toString(36).slice(2)}`}${extension}`;
    const storagePath = normalizedDestination
      ? `${normalizedDestination}/${filename}`
      : filename;

    const fileBuffer = await getFileBuffer(file);
    const { data, error } = await client.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase storage upload failed: ${error.message}`);
    }

    return storagePath;
  },

  async createResumableUploadUrl(filename, contentType, uploadId = randomUUID()) {
    const { url, bucket, anonKey } = getSupabaseConfig();
    if (!anonKey) {
      throw new Error('SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY) must be defined for large uploads');
    }

    const extension = path.extname(path.basename(filename || '')).toLowerCase();
    const storagePath = `content/${uploadId}${extension}`;
    const { data, error } = await getClient().storage
      .from(bucket)
      .createSignedUploadUrl(storagePath, { upsert: true });

    if (error) {
      throw new Error(`Supabase could not create the upload authorization: ${error.message}`);
    }

    const parsedUrl = new URL(url);
    const directStorageHost = parsedUrl.hostname.match(/^([^.]+)\.supabase\.co$/);
    if (directStorageHost) {
      parsedUrl.hostname = `${directStorageHost[1]}.storage.supabase.co`;
    }

    return {
      bucket,
      path: storagePath,
      signature: data.token,
      endpoint: `${parsedUrl.origin}/storage/v1/upload/resumable/sign`,
      apiKey: anonKey,
    };
  },

  /**
   * Deletes a stored file from the configured Supabase bucket.
   *
   * @param {string} storagePath - Relative storage path previously returned by upload().
   * @returns {Promise<void>}
   */
  async delete(storagePath) {
    const { bucket } = getSupabaseConfig();
    const client = getClient();
    const { error } = await client.storage.from(bucket).remove([storagePath]);
    if (error) {
      throw new Error(`Supabase storage remove failed: ${error.message}`);
    }
  },

  /**
   * Resolves a storage path to a public URL.
   *
   * @param {string} storagePath - Relative storage path previously returned by upload().
   * @returns {string} Public URL for the stored file.
   */
  resolveUrl(storagePath) {
    const { bucket } = getSupabaseConfig();
    const client = getClient();
    const { data, error } = client.storage.from(bucket).getPublicUrl(storagePath);
    if (error) {
      throw new Error(`Supabase storage getPublicUrl failed: ${error.message}`);
    }
    return data.publicUrl;
  },
};

export default supabaseProvider;
