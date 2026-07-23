import storage from '../storage/index.js';

export const resolveAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return null;

  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl;
  }

  const normalized = avatarUrl.startsWith('/uploads/')
    ? avatarUrl.replace(/^\/uploads\//, '')
    : avatarUrl;

  return storage.resolveUrl(normalized);
};
