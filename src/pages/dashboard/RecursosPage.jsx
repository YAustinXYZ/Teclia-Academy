import { useEffect } from 'react';
import { useContent } from '../../context/ContentContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { ContentGrid } from '../../components/content/ContentGrid.jsx';
import { planLabel } from '../../utils/plans.js';

const RecursosPage = () => {
  const { content, loadContent, loading } = useContent();
  const { user } = useAuth();
  const { t } = usePreferences();

  useEffect(() => {
    if (!content || content.length === 0) {
      loadContent();
    }
  }, []);

  return (
    <div className="page-shell">
      <section className="section-surface">
        <div className="section-intro">
          <p className="eyebrow-gold">{t('resources.eyebrow')}</p>
          <h2>{t('resources.title')}</h2>
          <p className="section-copy">
            {t('resources.copy')}
          </p>
          <div style={{ marginTop: '0.75rem' }}>
            <span className="chip chip-gold">{t('plan.label', { plan: planLabel(user?.plan_tier, t) })}</span>
          </div>
        </div>

        <ContentGrid content={content} isAdmin={false} user={user} loading={loading} />
      </section>
    </div>
  );
};

export default RecursosPage;
