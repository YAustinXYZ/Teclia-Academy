export const validatePassword = (password, t) => {
  const msg = (key) => (typeof t === 'function' ? t(key) : null);
  if (!password || password.length < 8) {
    return msg('password.min') || 'La contraseña debe tener al menos 8 caracteres';
  }
  if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(password)) {
    return msg('password.letters') || 'La contraseña debe incluir letras';
  }
  if (!/[0-9]/.test(password)) {
    return msg('password.numbers') || 'La contraseña debe incluir números';
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
    return msg('password.special') || 'La contraseña debe incluir al menos un carácter especial';
  }
  return null;
};

export const getPasswordHint = (t) =>
  (typeof t === 'function' ? t('password.hint') : null)
  || 'Mínimo 8 caracteres, con letras, números y un carácter especial.';

/** @deprecated Prefer getPasswordHint(t) */
export const PASSWORD_HINT = 'Mínimo 8 caracteres, con letras, números y un carácter especial.';

export const getPasswordStrength = (password, t) => {
  const label = (key, fallback) => (typeof t === 'function' ? t(key) : fallback);
  if (!password) return { score: 0, label: '', level: 'none' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) score += 1;
  if (password.length >= 16) score += 1;
  if (score <= 1) return { score, label: label('password.weak', 'Débil'), level: 'weak' };
  if (score <= 3) return { score, label: label('password.medium', 'Media'), level: 'medium' };
  if (score <= 4) return { score, label: label('password.strong', 'Fuerte'), level: 'strong' };
  return { score, label: label('password.veryStrong', 'Muy fuerte'), level: 'very-strong' };
};
