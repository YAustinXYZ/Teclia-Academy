import { useState } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { getSafeRedirect } from '../../utils/safeRedirect.js';
import { AuthLayout } from '../../components/auth/AuthLayout.jsx';
import { UIIcon } from '../../components/common/Icons.jsx';

export const LoginPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect') || searchParams.get('returnTo');
  const reason = searchParams.get('reason');
  const safeRedirect = getSafeRedirect(redirectParam);
  const { t } = usePreferences();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(location.state?.message || null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleForgotPassword = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError(t('auth.login.forgotNeedEmail'));
      return;
    }
    sessionStorage.setItem('recoveryEmail', normalizedEmail);
    navigate('/auth/forgot-password', { state: { email: normalizedEmail } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      sessionStorage.removeItem('recoveryEmail');
      navigate(safeRedirect || '/dashboard');
    } catch (err) {
      if (!err.response) {
        setError(t('auth.login.serverDown'));
      } else {
        setError(err.response.data?.error || t('auth.login.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.login.layoutTitle')}
      subtitle={t('auth.login.layoutSubtitle')}
    >
      <div className="auth-card">
          <h1>{t('auth.login.title')}</h1>
          <p className="auth-subtitle">{t('auth.login.subtitle')}</p>

          {reason === 'expired' && (
            <div className="error-message">
              {t('auth.login.expired')}
            </div>
          )}

          {error && <div key={error} className="error-message animate-shake">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t('common.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>

            <div className="form-group password-group">
              <label htmlFor="password">{t('common.password')}</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <div className="auth-link-row">
              <button type="button" className="link-button" onClick={handleForgotPassword}>
                {t('auth.login.forgot')}
              </button>
            </div>

            <button type="submit" disabled={loading} className="button button-primary button-block">
              {loading ? <span className="btn-loading"><span className="spinner" /> {t('common.loading')}</span> : t('auth.login.submit')}
            </button>
          </form>

          <p className="auth-footer">
            {t('auth.login.noAccount')} <Link to="/auth/signup">{t('auth.login.register')}</Link>
          </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
