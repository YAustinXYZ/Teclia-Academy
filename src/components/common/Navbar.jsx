import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { Logo } from './Logo.jsx';
import { UIIcon } from './Icons.jsx';
import { UserAvatar } from './UserAvatar.jsx';
import { planLabel } from '../../utils/plans.js';
import { useEffect, useState } from 'react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = usePreferences();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path, { exact = false } = {}) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  useEffect(() => {
    setMobileOpen(false);
    setSettingsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.body.classList.add('nav-drawer-open');
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('nav-drawer-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout({ redirectTo: '/auth/login' });
  };

  const closeMobile = () => setMobileOpen(false);

  const roleLabel = user?.role === 'admin'
    ? t('nav.instructor')
    : user?.plan_tier
      ? planLabel(user.plan_tier)
      : user?.role === 'premium'
        ? t('nav.premiumStudent')
        : t('nav.student');

  const navLinkClass = (path, opts) =>
    `button button-ghost nav-link ${isActive(path, opts) ? 'nav-active' : ''}`;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" title="Teclia" onClick={closeMobile}>
          <Logo size={36} showTagline={false} />
        </Link>

        <div className={`navbar-menu ${mobileOpen ? 'is-open' : ''}`} id="primary-navigation">
          {user ? (
            <div className="navbar-user">
              <div className="navbar-mobile-identity">
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.avatar_url}
                  size="md"
                  className="navbar-avatar"
                  placeholderClassName="navbar-avatar navbar-avatar-placeholder"
                />
                <div>
                  <p className="navbar-mobile-name">{user.name}</p>
                  <span className="user-role role-badge">{roleLabel}</span>
                </div>
              </div>

              <div className="navbar-links-inline">
                <Link to="/recursos" className={navLinkClass('/recursos')} onClick={closeMobile}>
                  {t('nav.resources')}
                </Link>
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin" className={navLinkClass('/admin', { exact: true })} onClick={closeMobile}>
                      {t('nav.school')}
                    </Link>
                    <Link to="/admin/students" className={navLinkClass('/admin/students')} onClick={closeMobile}>
                      {t('nav.students')}
                    </Link>
                    <Link
                      to="/admin/upload"
                      className={`button button-ghost nav-link ${['/admin/upload', '/admin/content'].includes(location.pathname) ? 'nav-active' : ''}`}
                      onClick={closeMobile}
                    >
                      {t('nav.content')}
                    </Link>
                  </>
                )}
              </div>

              <div className="navbar-mobile-account">
                <Link to="/profile" className="button button-ghost" onClick={closeMobile}>{t('nav.profile')}</Link>
                <Link to="/profile?tab=security" className="button button-ghost" onClick={closeMobile}>{t('nav.security')}</Link>
                <Link to="/profile?tab=subscription" className="button button-ghost" onClick={closeMobile}>{t('nav.subscription')}</Link>
                <button type="button" className="button button-secondary" onClick={() => { handleLogout(); closeMobile(); }}>
                  {t('nav.logout')}
                </button>
              </div>

              <span className="user-role role-badge navbar-role-desktop">{roleLabel}</span>
            </div>
          ) : (
            <div className="navbar-links">
              <Link to="/auth/login" className="button button-secondary" onClick={closeMobile}>
                {t('nav.login')}
              </Link>
              <Link to="/auth/signup" className="button button-primary" onClick={closeMobile}>
                {t('nav.signup')}
              </Link>
            </div>
          )}
        </div>

        <div className="navbar-actions">
          {user && (
            <>
              <Link to="/profile" className="navbar-avatar-link navbar-avatar-desktop" title={t('nav.profile')} onClick={closeMobile}>
                <UserAvatar
                  name={user.name}
                  avatarUrl={user.avatar_url}
                  size="sm"
                  className="navbar-avatar"
                  placeholderClassName="navbar-avatar navbar-avatar-placeholder"
                />
              </Link>

              <div className="settings-dropdown-container navbar-settings-desktop">
                <button
                  type="button"
                  className="button button-settings"
                  title={t('nav.account')}
                  aria-label={t('nav.account')}
                  aria-expanded={settingsOpen}
                  aria-haspopup="menu"
                  onClick={() => setSettingsOpen((open) => !open)}
                >
                  <UIIcon name="gear" size={18} />
                </button>
                {settingsOpen && (
                  <div className="settings-dropdown" role="menu">
                    <Link to="/profile" className="settings-option" role="menuitem" onClick={() => setSettingsOpen(false)}>
                      <UIIcon name="user" size={16} /> {t('nav.profile')}
                    </Link>
                    <Link to="/profile?tab=security" className="settings-option" role="menuitem" onClick={() => setSettingsOpen(false)}>
                      <UIIcon name="lock" size={16} /> {t('nav.security')}
                    </Link>
                    <Link to="/profile?tab=subscription" className="settings-option" role="menuitem" onClick={() => setSettingsOpen(false)}>
                      <UIIcon name="star" size={16} /> {t('nav.subscription')}
                    </Link>
                    <Link to="/profile?tab=preferences" className="settings-option" role="menuitem" onClick={() => setSettingsOpen(false)}>
                      <UIIcon name="gear" size={16} /> {t('profile.tab.preferences')}
                    </Link>
                    <div className="settings-divider" />
                    <button
                      type="button"
                      className="settings-option logout-option"
                      role="menuitem"
                      onClick={() => {
                        handleLogout();
                        setSettingsOpen(false);
                      }}
                    >
                      <UIIcon name="logout" size={16} /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            className="navbar-toggle"
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={mobileOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <UIIcon name={mobileOpen ? 'close' : 'menu'} size={20} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="navbar-overlay"
          aria-label={t('nav.closeMenu')}
          onClick={closeMobile}
        />
      )}
    </nav>
  );
};
