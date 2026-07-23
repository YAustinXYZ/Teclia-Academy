const VERSION = 'v1';

const keyFor = (userId) => `teclia:prefs:${VERSION}:${userId}`;

const DEFAULT_PREFS = {
  language: 'es',
  emailNotifications: true,
  marketingEmails: false,
  profileVisibility: 'private',
};

export const loadProfilePrefs = (userId) => {
  if (!userId) return { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

export const saveProfilePrefs = (userId, prefs) => {
  if (!userId) return;
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify({ ...DEFAULT_PREFS, ...prefs }));
  } catch {
    // ignore quota / private mode
  }
};

const activityKey = (userId) => `teclia:activity:${VERSION}:${userId}`;

export const loadRecentActivity = (userId) => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(activityKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const pushRecentActivity = (userId, entry) => {
  if (!userId || !entry?.id) return;
  try {
    const prev = loadRecentActivity(userId).filter((item) => item.id !== entry.id);
    const next = [{ ...entry, viewedAt: new Date().toISOString() }, ...prev].slice(0, 8);
    localStorage.setItem(activityKey(userId), JSON.stringify(next));
  } catch {
    // ignore
  }
};

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const validateAvatarFile = (file) => {
  if (!file) return 'Selecciona una imagen.';
  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return 'Solo se permiten JPEG, PNG o WebP.';
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return 'La imagen no puede superar 2 MB.';
  }
  return null;
};
