import { Link } from 'react-router-dom';
import { Logo } from './Logo.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';

const socials = [
  { label: 'IG', href: 'https://www.instagram.com/tecliaacademy?utm_source=qr', name: 'Instagram' },
  { label: 'YT', href: '#', name: 'YouTube' },
  { label: 'TT', href: '#', name: 'TikTok' },
  { label: 'IN', href: '#', name: 'LinkedIn' },
];

export const SiteFooter = () => {
  const { t } = usePreferences();

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <Logo size={40} showTagline={false} />
          <p>{t('footer.blurb')}</p>
        </div>

        <div>
          <h5>{t('footer.explore')}</h5>
          <div className="site-footer-links">
            <a href="/#inicio">{t('footer.home')}</a>
            <a href="/#como-funciona">{t('footer.how')}</a>
            <a href="/#planes">{t('footer.plans')}</a>
            <a href="/#explora">{t('footer.resources')}</a>
          </div>
        </div>

        <div>
          <h5>{t('footer.account')}</h5>
          <div className="site-footer-links">
            <Link to="/auth/login">{t('nav.login')}</Link>
            <Link to="/auth/signup">{t('nav.signup')}</Link>
            <Link to="/recursos">{t('nav.resources')}</Link>
            <Link to="/profile">{t('nav.profile')}</Link>
          </div>
        </div>

        <div>
          <h5>{t('footer.contact')}</h5>
          <div className="site-footer-links">
            <a href="mailto:austinrmz2007@gmail.com">austinrmz2007@gmail.com</a>
            <a href="tel:+50662608415">+506 6260 8415</a>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} Teclia. {t('footer.rights')}</span>
        <div className="site-footer-social">
          {socials.map((s) => (
            <a key={s.name} href={s.href} aria-label={s.name} title={s.name} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
