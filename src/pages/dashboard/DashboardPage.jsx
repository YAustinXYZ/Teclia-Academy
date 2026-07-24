import { useMemo } from 'react';
import { ContentGrid } from '../../components/content/ContentGrid.jsx';
import { hasAccess } from '../../components/content/ContentCard.jsx';
import { NextStepBanner } from '../../components/dashboard/NextStepBanner.jsx';
import { UIIcon } from '../../components/common/Icons.jsx';
import { UserAvatar } from '../../components/common/UserAvatar.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { planLabel } from '../../utils/plans.js';

export const DashboardPage = () => {
  const { content, loading } = useContent();
  const { user } = useAuth();
  const { t } = usePreferences();

  const hasPlan = Boolean(user?.plan_tier) || user?.role === 'premium' || user?.role === 'admin';

  const unlockedCount = useMemo(
    () => content.filter((item) => hasAccess(item, user)).length,
    [content, user]
  );

  const nextStep = hasPlan
    ? {
        title: t('dash.next.withPlan.title'),
        description: t('dash.next.withPlan.desc'),
        ctaLabel: t('dash.next.withPlan.cta'),
        to: '/recursos',
      }
    : {
        title: t('dash.next.noPlan.title'),
        description: t('dash.next.noPlan.desc'),
        ctaLabel: t('dash.next.noPlan.cta'),
        to: '/profile?tab=subscription',
      };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-main">
        <div className="welcome-banner animate-fade-up">
          <UserAvatar
            name={user?.name}
            avatarUrl={user?.avatar_url}
            size="lg"
            className="welcome-avatar"
            placeholderClassName="welcome-avatar"
          />
          <div>
            <h1>{t('dash.hello', { name: user?.name || t('dash.studentFallback') })}</h1>
            <p>{t('dash.welcome')}</p>
            <div className="welcome-meta">
              <span className="chip chip-gold">{planLabel(user?.plan_tier, t)}</span>
              <span className="chip chip-success"><span className="chip-dot" /> {t('common.active')}</span>
            </div>
          </div>
        </div>

        <NextStepBanner {...nextStep} />

        <div className="dash-stats">
          <div className="dash-stat">
            <div className="dash-stat-top"><span className="dash-stat-icon" aria-hidden="true"><UIIcon name="book" size={17} /></span> {t('dash.stats.available')}</div>
            <div className="dash-stat-value">{loading ? '—' : content.length}</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-top"><span className="dash-stat-icon" aria-hidden="true"><UIIcon name="unlock" size={17} /></span> {t('dash.stats.unlocked')}</div>
            <div className="dash-stat-value">{loading ? '—' : unlockedCount}</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-top"><span className="dash-stat-icon" aria-hidden="true"><UIIcon name="star" size={17} /></span> {t('dash.stats.plan')}</div>
            <div className="dash-stat-value" style={{ fontSize: '1.35rem' }}>{planLabel(user?.plan_tier, t)}</div>
          </div>
        </div>

        <ContentGrid content={content} isAdmin={false} user={user} loading={loading} />
      </div>
    </div>
  );
};

export default DashboardPage;
