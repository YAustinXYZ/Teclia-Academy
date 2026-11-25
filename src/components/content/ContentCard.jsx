import { Link } from 'react-router-dom';
import { Icon, UIIcon } from '../common/Icons.jsx';
import { StatusBadge } from '../admin/StatusBadge.jsx';
import { pushRecentActivity } from '../../utils/profilePrefs.js';
import { useAuth } from '../../hooks/useAuth.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { planLabel } from '../../utils/plans.js';

const TIER_ORDER = { free: 0, basico: 1, pro: 2, master: 3 };

const resolveTier = (item) => {
  if (item.is_free === 1 || item.is_free === true || item.is_free === '1') return 'free';
  return item.plan_tier || 'basico';
};

export const hasAccess = (item, user) => {
  const tier = resolveTier(item);
  if (tier === 'free') return true;
  if (!user) return false;
  if (user.role === 'admin') return true;
  const userTier = user.plan_tier || (user.role === 'premium' ? 'pro' : null);
  if (!userTier) return false;
  return (TIER_ORDER[userTier] ?? -1) >= (TIER_ORDER[tier] ?? 99);
};

export const ContentCard = ({ item, user: userProp }) => {
  const { user: authUser } = useAuth();
  const { t } = usePreferences();
  const user = userProp || authUser;
  const tier = resolveTier(item);
  const unlocked = hasAccess(item, user);

  const trackOpen = () => {
    if (!user?.id) return;
    pushRecentActivity(user.id, {
      id: item.id,
      title: item.title,
      type: item.type,
    });
  };

  return (
    <article className={`tc-card ${unlocked ? '' : 'locked'}`}>
      <div className="tc-thumb">
        <Icon type={item.type} />
        <span className="tc-tier">
          <StatusBadge status={tier} type="plan" />
        </span>
        {unlocked && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tc-overlay"
            aria-label={`${t('common.view')} ${item.title}`}
            onClick={trackOpen}
          >
            <span className="tc-view">{t('content.view')}</span>
          </a>
        )}
        {!unlocked && (
          <div className="tc-locked">
            <div className="tc-locked-inner">
              <span className="tc-lock-icon" aria-hidden="true"><UIIcon name="lock" size={24} /></span>
              <p>{t('content.locked', { tier: planLabel(tier, t) })}</p>
              <Link to="/profile?tab=subscription" className="button button-primary small">
                {t('content.upgrade')}
              </Link>
            </div>
          </div>
        )}
      </div>
      <div className="tc-body">
        <h3>{item.title}</h3>
        <p className="tc-desc">{item.description || t('common.noDescription')}</p>
        <p className="tc-author">{t('common.by', { name: item.uploaded_by_name || t('common.teclia') })}</p>
        {unlocked && (
          <div className="tc-actions">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-secondary small"
              onClick={trackOpen}
            >
              {t('content.open')}
            </a>
          </div>
        )}
      </div>
    </article>
  );
};

export default ContentCard;
