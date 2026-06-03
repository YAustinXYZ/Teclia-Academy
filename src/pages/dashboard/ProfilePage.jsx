import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { authService } from '../../services/api.js';
import { resolveAvatar, storeAvatar } from '../../utils/avatar.js';
import { validatePassword, PASSWORD_HINT } from '../../utils/password.js';
import { planLabel } from '../../utils/plans.js';

const pciSafeCard = (value) => value.replace(/[^0-9]/g, '');
const isValidLuhn = (cardNumber) => {
  const digits = cardNumber.split('').reverse().map(Number);
  const sum = digits.reduce((acc, digit, index) => {
    if (index % 2 === 1) {
      const doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + digit;
  }, 0);
  return sum % 10 === 0;
};

const vipPlans = [
  {
    label: 'Básico',
    price: '$9.99',
    features: ['Acceso a recursos', 'Lecciones guiadas', 'Comunidad privada'],
    details: 'Ideal para comenzar, con acceso completo a recursos y una comunidad dedicada al aprendizaje.',
  },
  {
    label: 'Pro',
    price: '$24.99',
    features: ['Feedback de IA', 'Clases 1:1', 'Partituras exclusivas'],
    details: 'El plan más equilibrado para acelerar tu progreso con tutoría guiada y contenido exclusivo.',
  },
  {
    label: 'Master',
    price: '$49.99',
    features: ['Plan personalizado', 'Sesiones premium', 'Análisis avanzado'],
    details: 'Para quienes quieren una experiencia VIP completa con seguimiento premium y soporte prioritario.',
  },
];

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [name, setName] = useState(user?.name || '');

  const [avatarPreview, setAvatarPreview] = useState(() => resolveAvatar(user?.avatar_url || ''));
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [changePassword, setChangePassword] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [activePlan, setActivePlan] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState({ cardNumber: '', expiry: '', cvc: '' });
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    setName(user?.name || '');
    setAvatarPreview(resolveAvatar(user?.avatar_url || ''));
    setAvatarFile(null);
  }, [user]);

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);

    try {
      let payload = undefined;
      if (avatarFile) {
        payload = new FormData();
        payload.append('name', name);
        payload.append('avatar', avatarFile);
      }
      const res = await updateProfile(name, payload);
      setProfileMessage('Perfil actualizado correctamente.');
      const savedUrl = res.user.avatar_url || '';
      if (savedUrl) {
        storeAvatar(res.user.id, savedUrl);
      }
      setAvatarPreview(resolveAvatar(savedUrl) || avatarPreview);
      setAvatarFile(null);
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.error || 'No se pudo actualizar el perfil.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (changePassword.new !== changePassword.confirm) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    const passwordError = validatePassword(changePassword.new);
    if (passwordError) {
      setPasswordError(passwordError);
      return;
    }

    try {
      await authService.changePassword(changePassword.current, changePassword.new);
      setPasswordSuccess(true);
      setChangePassword({ current: '', new: '', confirm: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Error cambiando contraseña');
    }
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const number = pciSafeCard(paymentInfo.cardNumber);
    if (!isValidLuhn(number)) {
      setPaymentStatus({ type: 'error', message: 'Número de tarjeta inválido. Revisa el número e inténtalo de nuevo.' });
      return;
    }
    setPaymentStatus({ type: 'success', message: 'Tarjeta válida. Próximamente integraremos pasarela de pago.' });
  };

  const handleUpgrade = () => {
    navigate('/');
    setTimeout(() => {
      window.location.hash = 'premium';
    }, 100);
  };

  const roleLabel = user?.role === 'admin'
    ? '👑 Instructor'
    : user?.plan_tier
      ? `✨ ${planLabel(user.plan_tier)}`
      : user?.role === 'premium'
        ? '✨ Premium'
        : '🎓 Estudiante';

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'security' || tab === 'subscription' || tab === 'general') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="profile-page">
      <div className="page-shell">
        <div className="profile-header">
          <h1>Perfil</h1>
          <p>Administra tu cuenta, seguridad y preferencias.</p>
        </div>

        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
            General
          </button>
          <button className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            Seguridad
          </button>
          <button className={`profile-tab ${activeTab === 'subscription' ? 'active' : ''}`} onClick={() => setActiveTab('subscription')}>
            Suscripción
          </button>
        </div>

        {activeTab === 'general' && (
          <div className="profile-content">
            <div className="profile-section">
              <h2>Información general</h2>
              <div className="profile-card">
                <form onSubmit={handleProfileSave} className="profile-form">
                  <div className="profile-row">
                    <div className="avatar-preview-card">
                      <div className="avatar-preview-shell">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar de perfil"
                            className="profile-avatar-image"
                            loading="lazy"
                            decoding="async"
                            width={128}
                            height={128}
                            onError={() => setAvatarPreview('')}
                          />
                        ) : (
                          <div className="avatar-placeholder">{user?.name?.slice(0, 1) || 'T'}</div>
                        )}
                      </div>
                      <label className="avatar-upload-label">
                        <span className="button button-secondary">Seleccionar imagen</span>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                      </label>
                      {avatarFile && <div className="avatar-selected-tag">Imagen elegida lista para subir</div>}
                    </div>
                    <div className="profile-fields">
                      <div className="profile-field">
                        <label>Nombre</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
                      </div>
                      <div className="profile-field">
                        <label>Email</label>
                        <p className="profile-value">{user?.email}</p>
                      </div>
                      <div className="profile-field">
                        <label>Rol</label>
                        <p className="profile-value role-badge">{roleLabel}</p>
                      </div>
                    </div>
                  </div>

                  {profileError && <div className="error-message">{profileError}</div>}
                  {profileMessage && <div className="success-message">{profileMessage}</div>}
                  <button type="submit" className="button button-primary">Guardar cambios</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="profile-content">
            <div className="profile-section">
              <h2>Cambiar contraseña</h2>
              <div className="profile-card">
                {passwordError && <div className="error-message">{passwordError}</div>}
                {passwordSuccess && <div className="success-message">Contraseña actualizada correctamente.</div>}
                <form onSubmit={handleChangePassword} className="password-form">
                  <div className="form-group password-group">
                    <label htmlFor="current">Contraseña actual</label>
                    <div className="password-field">
                      <input
                        id="current"
                        type={showPassword.current ? 'text' : 'password'}
                        value={changePassword.current}
                        onChange={(e) => setChangePassword({ ...changePassword, current: e.target.value })}
                        required
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}>
                        {showPassword.current ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div className="form-group password-group">
                    <label htmlFor="new">Nueva contraseña</label>
                    <div className="password-field">
                      <input
                        id="new"
                        type={showPassword.new ? 'text' : 'password'}
                        value={changePassword.new}
                        onChange={(e) => setChangePassword({ ...changePassword, new: e.target.value })}
                        required
                        placeholder="Ingresa tu nueva contraseña"
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}>
                        {showPassword.new ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <p className="field-hint">{PASSWORD_HINT}</p>
                  </div>
                  <div className="form-group password-group">
                    <label htmlFor="confirm">Confirmar nueva contraseña</label>
                    <div className="password-field">
                      <input
                        id="confirm"
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={changePassword.confirm}
                        onChange={(e) => setChangePassword({ ...changePassword, confirm: e.target.value })}
                        required
                        placeholder="Confirma tu nueva contraseña"
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}>
                        {showPassword.confirm ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="button button-primary">Actualizar contraseña</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="profile-content">
            <div className="profile-section">
              <h2>Planes VIP</h2>
              <div className="plan-grid">
                {vipPlans.map((plan) => (
                  <div key={plan.label} className={`plan-card ${activePlan === plan.label ? 'active' : ''}`}>
                    <div className="plan-card-header">
                      <div>
                        <h3>{plan.label}</h3>
                        <p className="plan-price">{plan.price}</p>
                      </div>
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => setActivePlan(activePlan === plan.label ? null : plan.label)}
                      >
                        {activePlan === plan.label ? 'Ocultar' : 'Ver más'}
                      </button>
                    </div>
                    {activePlan === plan.label && (
                      <div className="plan-details plan-card-details">
                        <p>{plan.details}</p>
                        <ul>
                          {plan.features.map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="subscription-info-bottom">
                {user?.role !== 'admin' && user?.role !== 'premium' ? (
                  <button onClick={handleUpgrade} className="button button-primary">
                    Mejorar a Premium
                  </button>
                ) : (
                  <p className="sub-description">Gracias por tu suscripción. Disfruta de todos los beneficios de tu plan.</p>
                )}
              </div>
            </div>

            <div className="profile-section">
              <h2>Método de pago</h2>
              <div className="profile-card">
                <form onSubmit={handlePaymentSubmit} className="payment-form">
                  <div className="form-group">
                    <label htmlFor="cardNumber">Número de tarjeta</label>
                    <input
                      id="cardNumber"
                      type="text"
                      inputMode="numeric"
                      value={paymentInfo.cardNumber}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                      placeholder="0000 0000 0000 0000"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group half-width">
                      <label htmlFor="expiry">Fecha expiración</label>
                      <input
                        id="expiry"
                        type="text"
                        value={paymentInfo.expiry}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, expiry: e.target.value })}
                        placeholder="MM/AA"
                        required
                      />
                    </div>
                    <div className="form-group half-width">
                      <label htmlFor="cvc">CVC</label>
                      <input
                        id="cvc"
                        type="text"
                        inputMode="numeric"
                        value={paymentInfo.cvc}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cvc: e.target.value })}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                  {paymentStatus && (
                    <div className={paymentStatus.type === 'success' ? 'success-message' : 'error-message'}>
                      {paymentStatus.message}
                    </div>
                  )}
                  <button type="submit" className="button button-primary">
                    Validar tarjeta
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
