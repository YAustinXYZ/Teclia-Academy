import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api.js';
import { validatePassword, getPasswordHint } from '../../utils/password.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';

const normalizeEmail = (email) => email.trim().toLowerCase();

export const ForgotPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = usePreferences();
  const recoveryEmail = normalizeEmail(
    location.state?.email || sessionStorage.getItem('recoveryEmail') || ''
  );

  const [email] = useState(recoveryEmail);
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [accountVerified, setAccountVerified] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!recoveryEmail) {
      navigate('/auth/login', {
        replace: true,
        state: { message: t('auth.forgot.needEmail') },
      });
      return;
    }

    sessionStorage.setItem('recoveryEmail', recoveryEmail);

    const verifyAccount = async () => {
      setVerifying(true);
      setError(null);
      try {
        await authService.verifyRecoveryEmail(recoveryEmail);
        setAccountVerified(true);
      } catch (err) {
        setAccountVerified(false);
        setError(err.response?.data?.error || t('auth.forgot.noAccount'));
      } finally {
        setVerifying(false);
      }
    };

    verifyAccount();
  }, [recoveryEmail, navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountVerified) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (!sent) {
        const res = await authService.forgotPassword(recoveryEmail);
        const successMessage = res.data.message || t('auth.forgot.sent');
        setMessage(successMessage);
        setSent(true);
      } else {
        const passwordError = validatePassword(newPassword, t);
        if (passwordError) {
          setError(passwordError);
          return;
        }
        await authService.resetPassword(recoveryEmail, pin, newPassword);
        sessionStorage.removeItem('recoveryEmail');
        setMessage(t('auth.forgot.resetOk'));
        setTimeout(() => navigate('/auth/login'), 1300);
      }
    } catch (err) {
      setError(err.response?.data?.error || (sent ? t('auth.forgot.resetFail') : t('auth.forgot.sendFail')));
    } finally {
      setLoading(false);
    }
  };

  if (!recoveryEmail) {
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>{sent ? t('auth.forgot.reset') : t('auth.forgot.title')}</h1>
          <p className="auth-subtitle">
            {sent ? t('auth.forgot.sentSubtitle') : t('auth.forgot.introSubtitle')}
          </p>

          {error && <div key={error} className="error-message animate-shake">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          {verifying ? (
            <p className="auth-subtitle">{t('auth.forgot.verifying')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="recover-email">{t('common.email')}</label>
                <input
                  id="recover-email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="input-readonly"
                />
              </div>

              {!accountVerified ? (
                <Link to="/auth/login" className="button button-secondary button-block">
                  {t('auth.forgot.back')}
                </Link>
              ) : !sent ? (
                <button type="submit" disabled={loading} className="button button-primary button-block">
                  {loading ? t('auth.forgot.sending') : t('auth.forgot.sendPinFull')}
                </button>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="recover-pin">{t('auth.forgot.pin')}</label>
                    <input
                      id="recover-pin"
                      type="text"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      required
                      placeholder="123456"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="recover-password">{t('auth.forgot.newPassword')}</label>
                    <input
                      id="recover-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder={t('auth.forgot.newPassword')}
                    />
                    <p className="field-hint">{getPasswordHint(t)}</p>
                  </div>
                  <button type="submit" disabled={loading} className="button button-primary button-block">
                    {loading ? t('auth.forgot.resetting') : t('auth.forgot.reset')}
                  </button>
                </>
              )}
            </form>
          )}

          <p className="auth-footer">
            {sent ? (
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setSent(false);
                  setMessage(null);
                  setError(null);
                  setPin('');
                  setNewPassword('');
                }}
              >
                {t('auth.forgot.resend')}
              </button>
            ) : (
              <Link to="/auth/login">{t('auth.forgot.remember')}</Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
