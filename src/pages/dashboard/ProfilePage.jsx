import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { authService } from '../../services/api.js';
import { resolveAvatar, storeAvatar, clearStoredAvatar } from '../../utils/avatar.js';
import { validatePassword, PASSWORD_HINT } from '../../utils/password.js';
import { planLabel } from '../../utils/plans.js';
import {
  loadProfilePrefs,
  saveProfilePrefs,
  loadRecentActivity,
  validateAvatarFile,
} from '../../utils/profilePrefs.js';
import StripeCardForm from '../../components/payments/StripeCardForm.jsx';
import { CheckoutFlow } from '../../components/payments/CheckoutFlow.jsx';
import { UIIcon } from '../../components/common/Icons.jsx';
import { useToast } from '../../context/ToastContext.jsx';

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

const PROFILE_TABS = ['general', 'security', 'subscription', 'preferences', 'activity', 'billing'];

const mapProfileError = (err) => {
  if (!err.response) {
    return { general: 'Error de conexión. Intenta de nuevo.', field: null };
  }

  const status = err.response.status;
  const message = err.response.data?.error || 'No se pudo actualizar el perfil.';

  if (status === 400) {
    return { general: null, field: message };
  }

  return { general: message, field: null };
};

const mapPasswordError = (err) => {
  if (!err.response) {
    return 'Error de conexión. Intenta de nuevo.';
  }
  return err.response.data?.error || 'Error cambiando contraseña';
};

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('general');
  const [name, setName] = useState(user?.name || '');

  const [avatarPreview, setAvatarPreview] = useState(() => resolveAvatar(user?.avatar_url || ''));
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [nameFieldError, setNameFieldError] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [changePassword, setChangePassword] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [activePlan, setActivePlan] = useState(null);
  const [prefs, setPrefs] = useState(() => loadProfilePrefs(user?.id));
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [recentActivity, setRecentActivity] = useState(() => loadRecentActivity(user?.id));

  useEffect(() => {
    setName(user?.name || '');
    setAvatarPreview(resolveAvatar(user?.avatar_url || ''));
    setAvatarFile(null);
    setAvatarBroken(false);
    setAvatarError(null);
    setPrefs(loadProfilePrefs(user?.id));
    setRecentActivity(loadRecentActivity(user?.id));
  }, [user]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'general' ? {} : { tab }, { replace: true });
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setAvatarError(validationError);
      setAvatarFile(null);
      toast.error(validationError);
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);
    setAvatarBroken(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = async () => {
    setProfileMessage(null);
    setProfileError(null);
    setProfileSaving(true);
    try {
      await updateProfile(name, { removeAvatar: true });
      setAvatarPreview('');
      setAvatarFile(null);
      setAvatarBroken(false);
      clearStoredAvatar(user?.id);
      toast.success('Foto de perfil eliminada.');
      setProfileMessage('Foto de perfil eliminada.');
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      const { general } = mapProfileError(err);
      const message = general || 'No se pudo eliminar la foto.';
      setProfileError(message);
      toast.error(message);
    } finally {
      setProfileSaving(false);
    }
  };

  const formatMemberSince = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);
    setNameFieldError(null);
    setAvatarError(null);
    setProfileSaving(true);

    try {
      let payload = undefined;
      if (avatarFile) {
        const validationError = validateAvatarFile(avatarFile);
        if (validationError) {
          setAvatarError(validationError);
          toast.error(validationError);
          return;
        }
        payload = new FormData();
        payload.append('name', name);
        payload.append('avatar', avatarFile);
      }
      const res = await updateProfile(name, payload);
      setProfileMessage('Perfil actualizado correctamente.');
      toast.success('Perfil actualizado correctamente.');
      const savedUrl = res.user.avatar_url || '';
      if (savedUrl) {
        storeAvatar(res.user.id, savedUrl);
      } else {
        clearStoredAvatar(res.user.id);
      }
      setAvatarPreview(resolveAvatar(savedUrl) || '');
      setAvatarFile(null);
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      const { general, field } = mapProfileError(err);
      if (field) {
        setNameFieldError(field);
        toast.error(field);
      } else {
        setProfileError(general);
        toast.error(general);
      }
    } finally {
      setProfileSaving(false);
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

    const passwordValidation = validatePassword(changePassword.new);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    try {
      setPasswordSaving(true);
      await authService.changePassword(changePassword.current, changePassword.new);
      setPasswordSuccess(true);
      toast.success('Contraseña actualizada correctamente.');
      setChangePassword({ current: '', new: '', confirm: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      const message = mapPasswordError(err);
      setPasswordError(message);
      toast.error(message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSavePrefs = (e) => {
    e.preventDefault();
    saveProfilePrefs(user?.id, prefs);
    setPrefsSaved(true);
    toast.success('Preferencias guardadas en este dispositivo.');
    setTimeout(() => setPrefsSaved(false), 2500);
  };

  const roleLabel = user?.role === 'admin'
    ? 'Instructor'
    : user?.plan_tier
      ? planLabel(user.plan_tier)
      : user?.role === 'premium'
        ? 'Premium'
        : 'Estudiante';

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (PROFILE_TABS.includes(tab)) {
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

        <div className="profile-tabs" role="tablist" aria-label="Secciones del perfil">
          {[
            ['general', 'General'],
            ['security', 'Seguridad'],
            ['subscription', 'Suscripción'],
            ['preferences', 'Preferencias'],
            ['activity', 'Actividad'],
            ['billing', 'Facturación'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={`profile-tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => selectTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
          <div className="profile-content">
            <div className="profile-summary-grid">
              <div className="profile-summary-card">
                <span className="profile-summary-label">Plan actual</span>
                <strong className="profile-summary-value role-badge">{roleLabel}</strong>
              </div>
              <div className="profile-summary-card">
                <span className="profile-summary-label">Miembro desde</span>
                <strong className="profile-summary-value">{formatMemberSince(user?.created_at)}</strong>
              </div>
              <div className="profile-summary-card">
                <span className="profile-summary-label">Correo</span>
                <strong className="profile-summary-value">{user?.email}</strong>
              </div>
            </div>

            <div className="profile-section">
              <h2>Información general</h2>
              <div className="profile-card">
                <form onSubmit={handleProfileSave} className="profile-form">
                  <div className="profile-row">
                    <div className="avatar-preview-card">
                      <div className="avatar-preview-shell">
                        {avatarPreview && !avatarBroken ? (
                          <img
                            src={avatarPreview}
                            alt={user?.name ? `Foto de perfil de ${user.name}` : 'Avatar de perfil'}
                            className="profile-avatar-image"
                            loading="lazy"
                            decoding="async"
                            width={128}
                            height={128}
                            onError={() => setAvatarBroken(true)}
                          />
                        ) : (
                          <div className="avatar-placeholder">{user?.name?.slice(0, 1) || 'T'}</div>
                        )}
                      </div>
                      <label className="avatar-upload-label">
                        <span className="button button-secondary">Seleccionar imagen</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} />
                      </label>
                      <p className="avatar-help-text">JPEG, PNG o WebP · máx. 2 MB</p>
                      {(avatarPreview || user?.avatar_url) && (
                        <button
                          type="button"
                          className="button button-ghost profile-remove-avatar"
                          onClick={handleRemoveAvatar}
                          disabled={profileSaving}
                        >
                          Quitar foto
                        </button>
                      )}
                      {avatarFile && <div className="avatar-selected-tag">Vista previa lista — pulsa Guardar</div>}
                      {avatarError && <p className="field-error">{avatarError}</p>}
                    </div>
                    <div className="profile-fields">
                      <div className="profile-field">
                        <label htmlFor="profile-name">Nombre</label>
                        <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
                        {nameFieldError && <p className="field-error">{nameFieldError}</p>}
                      </div>
                      <div className="profile-field">
                        <label>Email</label>
                        <p className="profile-value">{user?.email}</p>
                      </div>
                      <div className="profile-field">
                        <label>Rol</label>
                        <p className="profile-value role-badge">{roleLabel}</p>
                      </div>
                      <div className="profile-field">
                        <label>Última actualización</label>
                        <p className="profile-value">{formatMemberSince(user?.updated_at || user?.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {profileError && <div className="error-message">{profileError}</div>}
                  {profileMessage && <div className="success-message">{profileMessage}</div>}
                  <button type="submit" className="button button-primary" disabled={profileSaving}>
                    {profileSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
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
                      <button type="button" className="password-toggle" aria-label={showPassword.current ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}>
                        <UIIcon name={showPassword.current ? 'eyeOff' : 'eye'} size={18} />
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
                      <button type="button" className="password-toggle" aria-label={showPassword.new ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}>
                        <UIIcon name={showPassword.new ? 'eyeOff' : 'eye'} size={18} />
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
                      <button type="button" className="password-toggle" aria-label={showPassword.confirm ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}>
                        <UIIcon name={showPassword.confirm ? 'eyeOff' : 'eye'} size={18} />
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="button button-primary" disabled={passwordSaving}>
                    {passwordSaving ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
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
            </div>

            <div className="profile-section">
              <h2>Actualizar plan</h2>
              <div className="profile-card">
                <CheckoutFlow
                  initialPlan={user?.plan_tier}
                  renderPaymentForm={({ plan, onSuccess }) => (
                    <StripeCardForm
                      submitLabel="Guardar método de pago"
                      successMessage={`Método de pago del plan ${plan.label} enviado correctamente.`}
                      onSuccess={onSuccess}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="profile-content">
            <div className="profile-section">
              <h2>Preferencias</h2>
              <div className="profile-card">
                <form onSubmit={handleSavePrefs} className="profile-form prefs-form">
                  <div className="profile-field">
                    <label htmlFor="pref-language">Idioma</label>
                    <select
                      id="pref-language"
                      className="filter-select"
                      value={prefs.language}
                      onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <label className="prefs-check">
                    <input
                      type="checkbox"
                      checked={prefs.emailNotifications}
                      onChange={(e) => setPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))}
                    />
                    Recibir avisos por email (clases, progreso)
                  </label>
                  <label className="prefs-check">
                    <input
                      type="checkbox"
                      checked={prefs.marketingEmails}
                      onChange={(e) => setPrefs((p) => ({ ...p, marketingEmails: e.target.checked }))}
                    />
                    Recibir novedades y ofertas de Teclia
                  </label>
                  <div className="profile-field">
                    <label htmlFor="pref-visibility">Privacidad del perfil</label>
                    <select
                      id="pref-visibility"
                      className="filter-select"
                      value={prefs.profileVisibility}
                      onChange={(e) => setPrefs((p) => ({ ...p, profileVisibility: e.target.value }))}
                    >
                      <option value="private">Privado (solo tú e instructores)</option>
                      <option value="community">Visible en comunidad</option>
                    </select>
                  </div>
                  {prefsSaved && <div className="success-message">Preferencias guardadas.</div>}
                  <button type="submit" className="button button-primary">Guardar preferencias</button>
                  <p className="field-hint">Se guardan en este dispositivo por ahora (sin API adicional).</p>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="profile-content">
            <div className="profile-section">
              <h2>Actividad reciente</h2>
              <div className="profile-card">
                <div className="profile-summary-grid activity-plan-grid">
                  <div className="profile-summary-card">
                    <span className="profile-summary-label">Plan</span>
                    <strong className="profile-summary-value">{roleLabel}</strong>
                  </div>
                  <div className="profile-summary-card">
                    <span className="profile-summary-label">Acceso</span>
                    <strong className="profile-summary-value">
                      {user?.plan_tier ? `Contenido ${planLabel(user.plan_tier)}` : 'Recursos gratuitos'}
                    </strong>
                  </div>
                </div>
                {recentActivity.length === 0 ? (
                  <div className="empty-state compact">
                    <p>Aún no hay recursos vistos en este dispositivo.</p>
                    <p className="field-hint">Cuando abras lecciones desde Recursos, aparecerán aquí.</p>
                  </div>
                ) : (
                  <ul className="activity-list">
                    {recentActivity.map((item) => (
                      <li key={`${item.id}-${item.viewedAt}`}>
                        <strong>{item.title || `Recurso #${item.id}`}</strong>
                        <span>{item.type || 'contenido'}</span>
                        <time dateTime={item.viewedAt}>
                          {item.viewedAt ? new Date(item.viewedAt).toLocaleString('es-MX') : '—'}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="profile-content">
            <div className="profile-section">
              <h2>Facturación</h2>
              <div className="profile-card">
                <p className="field-hint">
                  Historial de pagos Stripe estará disponible cuando el endpoint de facturación esté activo.
                </p>
                <div className="profile-summary-grid">
                  <div className="profile-summary-card">
                    <span className="profile-summary-label">Plan facturado</span>
                    <strong className="profile-summary-value">{user?.plan_tier ? planLabel(user.plan_tier) : 'Free'}</strong>
                  </div>
                  <div className="profile-summary-card">
                    <span className="profile-summary-label">Método de pago</span>
                    <strong className="profile-summary-value">Gestionar en Suscripción</strong>
                  </div>
                </div>
                <button type="button" className="button button-secondary" onClick={() => selectTab('subscription')}>
                  Ir a suscripción
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
