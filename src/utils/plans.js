export const CONTENT_PLANS = [
  { value: 'free', labelKey: 'plan.freeFull' },
  { value: 'basico', labelKey: 'plan.basicoFull' },
  { value: 'pro', labelKey: 'plan.proFull' },
  { value: 'master', labelKey: 'plan.masterFull' },
];

export const STUDENT_PLANS = [
  { value: '', labelKey: 'plan.noneStudent' },
  { value: 'basico', labelKey: 'plan.basico' },
  { value: 'pro', labelKey: 'plan.pro' },
  { value: 'master', labelKey: 'plan.master' },
];

/** Short plan name for chips/badges. Pass `t` from usePreferences for i18n. */
export const planLabel = (tier, t) => {
  const translate = typeof t === 'function' ? t : (key) => {
    const fallback = {
      'plan.student': 'Estudiante',
      'plan.free': 'Gratis',
      'plan.basico': 'Básico',
      'plan.pro': 'Pro',
      'plan.master': 'Master',
      'plan.premium': 'Premium',
    };
    return fallback[key] || key;
  };

  if (!tier || tier === 'student') return translate('plan.student');
  if (tier === 'free') return translate('plan.free');
  if (tier === 'basico') return translate('plan.basico');
  if (tier === 'pro') return translate('plan.pro');
  if (tier === 'master') return translate('plan.master');
  if (tier === 'premium') return translate('plan.premium');
  return String(tier);
};

export const studentPlanOptions = (t) =>
  STUDENT_PLANS.map((p) => ({
    value: p.value,
    label: t(p.labelKey),
  }));

export const contentPlanOptions = (t) =>
  CONTENT_PLANS.map((p) => ({
    value: p.value,
    label: t(p.labelKey),
  }));
