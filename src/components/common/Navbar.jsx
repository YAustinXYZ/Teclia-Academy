import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Logo } from './Logo.jsx';
import { resolveAvatar } from '../../utils/avatar.js';
import { planLabel } from '../../utils/plans.js';
import { useEffect, useState } from 'react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminPath = (path) => location.pathname === path;
  const avatarSrc = resolveAvatar(user?.avatar_url || '');

  useEffect(() => {
    setMobileOpen(false);
    setSettingsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" title="Volver al inicio" onClick={closeMobile}>
          <Logo size={36} showTagline={false} />
        </Link>

        <div className={`navbar-menu ${mobileOpen ? 'is-open' : ''}`}>
          {user ? (
            <div className="navbar-user">
              <div className="navbar-links-inline">
                <Link to="/recursos" className="button button-ghost" onClick={closeMobile}>Recursos</Link>
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin" className={`button button-ghost ${isAdminPath('/admin') ? 'nav-active' : ''}`} onClick={closeMobile}>Mi escuela</Link>
                    <Link to="/admin/students" className={`button button-ghost ${isAdminPath('/admin/students') ? 'nav-active' : ''}`} onClick={closeMobile}>Estudiantes</Link>
                    <Link to="/admin/upload" className={`button button-ghost ${['/admin/upload', '/admin/content'].includes(location.pathname) ? 'nav-active' : ''}`} onClick={closeMobile}>Gestionar contenido</Link>
                  </>
                )}
              </div>
              <span className="user-role role-badge">
                {user.role === 'admin'
                  ? '👑 Instructor'
                  : user.plan_tier
                    ? `✨ ${planLabel(user.plan_tier)}`
                    : user.role === 'premium'
                      ? '✨ Alumno premium'
                      : '🎓 Estudiante'}
              </span>
            </div>
          ) : (
            <div className="navbar-links">
              <Link to="/auth/login" className="button button-secondary" onClick={closeMobile}>
                Iniciar sesión
              </Link>
              <Link to="/auth/signup" className="button button-primary" onClick={closeMobile}>
                Registro de alumnos
              </Link>
            </div>
          )}
        </div>

        <div className="navbar-actions">
          {user && (
            <>
              <Link to="/profile" className="navbar-avatar-link navbar-avatar-desktop" title="Mi perfil" onClick={closeMobile}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Foto de perfil" className="navbar-avatar" loading="lazy" decoding="async" width={38} height={38} />
                ) : (
                  <span className="navbar-avatar navbar-avatar-placeholder">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </Link>

              <div className="settings-dropdown-container">
                <button
                  className="button button-settings"
                  title="Configuración"
                  onClick={() => setSettingsOpen(!settingsOpen)}
                >
                  ⚙️
                </button>
                {settingsOpen && (
                  <div className="settings-dropdown">
                    <Link to="/profile" className="settings-option" onClick={() => { setSettingsOpen(false); closeMobile(); }}>
                      👤 Mi Perfil
                    </Link>
                    <Link to="/profile?tab=security" className="settings-option" onClick={() => { setSettingsOpen(false); closeMobile(); }}>
                      🔒 Seguridad
                    </Link>
                    <Link to="/profile?tab=subscription" className="settings-option" onClick={() => { setSettingsOpen(false); closeMobile(); }}>
                      ⭐ Suscripción
                    </Link>
                    <div className="settings-divider"></div>
                    <button
                      className="settings-option logout-option"
                      onClick={() => {
                        handleLogout();
                        setSettingsOpen(false);
                        closeMobile();
                      }}
                    >
                      🚪 Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            className="navbar-toggle"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  );
};
