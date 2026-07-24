import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { validatePassword, getPasswordHint } from '../../utils/password.js';
import { PasswordStrengthMeter } from '../../components/common/PasswordStrengthMeter.jsx';
import { AuthLayout } from '../../components/auth/AuthLayout.jsx';
import { UIIcon } from '../../components/common/Icons.jsx';

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = usePreferences();

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('auth.signup.mismatch'));
      return;
    }

    const passwordError = validatePassword(password, t);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.signup.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.signup.layoutTitle')}
      subtitle={t('auth.signup.layoutSubtitle')}
    >
      <div className="auth-card">
          <h1>{t('auth.signup.title')}</h1>
          <p className="auth-subtitle">{t('auth.signup.subtitle')}</p>

          {error && <div key={error} className="error-message animate-shake">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">{t('common.name')}</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={t('auth.signup.namePlaceholder')}
              />
            </div>

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
              <PasswordStrengthMeter password={password} />
              <p className="field-hint">{getPasswordHint(t)}</p>
            </div>

            <div className="form-group password-group">
              <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
              <div className="password-field">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showConfirmPassword ? t('common.hidePassword') : t('common.showPassword')}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <UIIcon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="button button-primary button-block">
              {loading ? <span className="btn-loading"><span className="spinner" /> {t('admin.creating')}</span> : t('auth.signup.submit')}
            </button>
          </form>

          <p className="auth-footer">
            {t('auth.signup.hasAccount')} <Link to="/auth/login">{t('auth.signup.login')}</Link>
          </p>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
