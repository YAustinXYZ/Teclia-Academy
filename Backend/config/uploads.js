import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolveUploadsRoot = () => {
  if (process.env.UPLOADS_PATH) {
    return process.env.UPLOADS_PATH;
  }

  if (process.env.DATABASE_DIR) {
    return path.join(process.env.DATABASE_DIR, 'uploads');
  }

  if (process.env.RENDER_DATA_DIR) {
    return path.join(process.env.RENDER_DATA_DIR, 'uploads');
  }

  return process.env.RENDER
    ? '/tmp/uploads'
    : path.join(__dirname, '../uploads');
};

export const getUploadsPath = () => {
  const uploadsPath = resolveUploadsRoot();
  fs.mkdirSync(uploadsPath, { recursive: true });
  return uploadsPath;
};

export const getAvatarUploadsPath = () => {
  const avatarPath = path.join(getUploadsPath(), 'avatars');
  fs.mkdirSync(avatarPath, { recursive: true });
  return avatarPath;
};
