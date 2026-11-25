import { getPasswordStrength } from '../../utils/password.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';

export const PasswordStrengthMeter = ({ password }) => {
  const { t } = usePreferences();
  const { score, label, level } = getPasswordStrength(password, t);
  if (level === 'none') return null;
  const barWidth = `${Math.min(100, (score / 6) * 100)}%`;
  return (
    <div className="password-strength" role="status" aria-label={t('password.strength', { label })}>
      <div className="password-strength-bar">
        <div className={`password-strength-fill strength-${level}`} style={{ width: barWidth }} />
      </div>
      <span className={`password-strength-label strength-${level}`}>{label}</span>
    </div>
  );
};

export default PasswordStrengthMeter;
