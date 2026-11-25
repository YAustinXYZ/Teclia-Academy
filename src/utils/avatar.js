import { BACKEND_BASE_URL } from '../services/api.js';

export const resolveAvatar = (value) => {
  if (!value) return '';
  if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  const normalized = value.startsWith('/uploads/')
    ? value
    : value.startsWith('/')
      ? value
      : `/uploads/${value.replace(/^\/+/, '')}`;

  return `${BACKEND_BASE_URL}${normalized}`;
};

export const getStoredAvatar = (userId) => {
  if (!userId) return '';
  return localStorage.getItem(`avatar_${userId}`) || '';
};

export const storeAvatar = (userId, avatarUrl) => {
  if (!userId || !avatarUrl) return;
  localStorage.setItem(`avatar_${userId}`, avatarUrl);
};

export const clearStoredAvatar = (userId) => {
  if (!userId) return;
  localStorage.removeItem(`avatar_${userId}`);
};
