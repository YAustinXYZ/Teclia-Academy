import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api.js';
import { validatePassword, getPasswordHint } from '../../utils/password.js';
import { UIIcon } from '../../components/common/Icons.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';

export const ResetPasswordPage = () => {
  const location = useLocation();
  const { t } = usePreferences();
  const [email, setEmail] = useState(location.state?.email || '');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(location.state?.successMessage || null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const passwordError = validatePassword(newPassword, t);
      if (passwordError) {
        setError(passwordError);
        return;
      }
      await authService.resetPassword(email, pin, newPassword);
      setMessage(t('auth.forgot.resetOk'));
      setTimeout(() => navigate('/auth/login'), 1300);
    } catch (err) {
      setError(err.response?.data?.error || t('auth.forgot.resetFail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>{t('auth.forgot.reset')}</h1>
          <p className="auth-subtitle">{t('auth.forgot.sentSubtitle')}</p>

          {error && <div key={error} className="error-message animate-shake">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          {location.state?.email && (
            <div className="info-message">
              {t('auth.reset.pinSent', { email: location.state.email })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reset-email">{t('common.email')}</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reset-pin">{t('auth.forgot.pin')}</label>
              <input
                id="reset-pin"
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                placeholder="123456"
              />
            </div>
            <div className="form-group password-group">
              <label htmlFor="reset-password">{t('auth.forgot.newPassword')}</label>
              <div className="password-field">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <UIIcon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
              <p className="field-hint">{getPasswordHint(t)}</p>
            </div>
            <button type="submit" disabled={loading} className="button button-primary button-block">
              {loading ? <span className="btn-loading"><span className="spinner" /> {t('auth.forgot.resetting')}</span> : t('auth.forgot.reset')}
            </button>
          </form>

          <p className="auth-footer">
            {t('auth.reset.noPin')} <Link to="/auth/forgot-password">{t('auth.forgot.resend')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
