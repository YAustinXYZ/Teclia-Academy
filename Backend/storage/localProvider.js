import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ALLOWED_TYPES = 'image/jpeg,image/png,application/pdf';
const DEFAULT_MAX_SIZE_MB = 10;

const getUploadRoot = () => path.resolve(__dirname, '../uploads');

const getAllowedTypes = () => {
  const raw = process.env.UPLOAD_ALLOWED_TYPES || DEFAULT_ALLOWED_TYPES;
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
};

const getMaxSizeBytes = () => {
  const raw = process.env.UPLOAD_MAX_SIZE_MB || DEFAULT_MAX_SIZE_MB;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1024 * 1024 : DEFAULT_MAX_SIZE_MB * 1024 * 1024;
};

const ensureWithinRoot = (targetPath) => {
  const root = getUploadRoot();
  const resolved = path.resolve(root, targetPath);
  if (!resolved.startsWith(root)) {
    throw new Error('Invalid storage path');
  }
  return resolved;
};

const createRelativePath = (destination, filename) => {
  const normalizedDestination = destination.replace(/^\/+|\/+$/g, '');
  return normalizedDestination
    ? `${normalizedDestination}/${filename}`
    : filename;
};

const validateFile = (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  const allowedTypes = getAllowedTypes();
  if (allowedTypes.length > 0 && file.mimetype && !allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} is not allowed`);
  }

  const maxBytes = getMaxSizeBytes();
  if (typeof file.size === 'number' && file.size > maxBytes) {
    throw new Error(`File exceeds the maximum size of ${maxBytes / 1024 / 1024}MB`);
  }
};

const saveFileBuffer = async (file, destination) => {
  const uploadRoot = getUploadRoot();
  const absoluteDestination = path.resolve(uploadRoot, destination);
  await fs.mkdir(absoluteDestination, { recursive: true });

  const extension = path.extname(file.originalname || file.name || '').toLowerCase();
  const filename = `${randomUUID()}${extension}`;
  const finalPath = path.join(absoluteDestination, filename);

  if (file.buffer) {
    await fs.writeFile(finalPath, file.buffer);
  } else if (file.path) {
    await fs.copyFile(file.path, finalPath);
    if (fsSync.existsSync(file.path)) {
      await fs.unlink(file.path).catch(() => {});
    }
  } else {
    throw new Error('Unsupported file input for local storage');
  }

  return createRelativePath(destination, filename);
};

const localProvider = {
  /**
   * Stores a file in the local uploads directory.
   *
   * @param {object} file - Multer file object.
   * @param {string} destination - Relative subfolder, for example: 'content' or 'avatars'.
   * @returns {Promise<string>} Relative storage path such as 'content/uuid.png'.
   */
  async upload(file, destination = '') {
    validateFile(file);
    const normalizedDestination = (destination || '').replace(/^\/+|\/+$/g, '');
    return saveFileBuffer(file, normalizedDestination);
  },

  async createResumableUploadUrl() {
    throw new Error('Resumable uploads require Supabase Storage; configure Supabase and set LOCAL_UPLOADS=false');
  },

  /**
   * Deletes a file from the local uploads directory.
   *
   * @param {string} storagePath - Relative storage path previously returned by upload().
   * @returns {Promise<void>}
   */
  async delete(storagePath) {
    if (!storagePath) return;

    const resolvedPath = ensureWithinRoot(storagePath);
    await fs.unlink(resolvedPath).catch((error) => {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    });
  },

  /**
   * Builds a URL-friendly path for the stored file.
   *
   * @param {string} storagePath - Relative storage path previously returned by upload().
   * @returns {string} URL path such as '/uploads/content/uuid.png'.
   */
  resolveUrl(storagePath) {
    if (!storagePath) return '';
    const normalized = storagePath.replace(/^\/+|\/+$/g, '');
    return `/uploads/${normalized}`;
  },
};

export default localProvider;
