import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Icon, UIIcon } from '../../components/common/Icons.jsx';
import { PersonaBanner } from '../../components/common/PersonaBanner.jsx';
import { AdminBreadcrumbs } from '../../components/common/AdminBreadcrumbs.jsx';
import { useContent } from '../../context/ContentContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { statsService } from '../../services/api.js';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '../../components/common/KeyboardShortcuts.jsx';

const StatCard = ({ label, value, icon, trend, highlight }) => (
  <div className={`stat-card ${highlight ? 'highlight' : ''}`}>
    <div className="stat-card-header">
      {icon && <span className="stat-icon">{icon}</span>}
      <span className="stat-label">{label}</span>
    </div>
    <div className="stat-value">{value ?? '—'}</div>
    {trend !== undefined && (
      <div className={`stat-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const SkeletonStat = () => (
  <div className="stat-card skeleton">
    <div className="skeleton-line skeleton-line-sm" />
    <div className="skeleton-line skeleton-line-lg" />
    <div className="skeleton-line skeleton-line-xs" />
  </div>
);

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { content } = useContent();
  const { user } = useAuth();
  const { t } = usePreferences();
  const [pageVisits, setPageVisits] = useState(null);
  const [studentCount, setStudentCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useKeyboardShortcuts({
    showHelp: () => setShowShortcuts((p) => !p),
    addStudent: () => navigate('/admin/students'),
    createContent: () => navigate('/admin/upload'),
    goDashboard: () => navigate('/admin'),
    goStudents: () => navigate('/admin/students'),
    goContent: () => navigate('/admin/content'),
  });

  const recentContent = content.slice(0, 5);
  const stats = {
    total: content.length,
    videos: content.filter(c => c.type === 'video').length,
    pdfs: content.filter(c => c.type === 'pdf').length,
    audios: content.filter(c => c.type === 'audio').length,
    images: content.filter(c => c.type === 'image').length,
  };

  useEffect(() => {
    statsService
      .getVisitStats()
      .then((res) => {
        setPageVisits(res.data.pageVisits || 0);
        setStudentCount(res.data.studentCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-layout">
      <div className="dashboard-main">
        <AdminBreadcrumbs items={[{ label: t('admin.breadcrumb.school') }]} />
        <PersonaBanner
          name={t('admin.banner.title')}
          subtitle={t('admin.banner.subtitle', { name: user?.name || '' })}
          initial={user?.name?.charAt(0)?.toUpperCase() || 'A'}
          chips={[
            { label: t('admin.banner.admin'), variant: 'gold' },
            { label: user?.email || '', },
            { label: t('admin.banner.active'), variant: 'success' },
          ]}
          actions={(
            <>
              <Link to="/admin/upload" className="button button-primary">+ {t('admin.createContent')}</Link>
              <Link to="/admin/students" className="button button-secondary">{t('admin.students')}</Link>
            </>
          )}
        />

        <div className="admin-stats">
          <h2>{t('admin.summary')}</h2>
          <div className="stats-grid">
            {loading ? (
              <>
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
              </>
            ) : (
              <>
                <StatCard label={t('admin.pageVisits')} value={pageVisits} icon={<UIIcon name="eye" size={18} />} trend={12} highlight />
                <StatCard label={t('admin.stats.students')} value={studentCount} icon={<UIIcon name="users" size={18} />} trend={8} />
                <StatCard label={t('admin.totalContent')} value={stats.total} icon={<UIIcon name="book" size={18} />} />
                <StatCard label={t('admin.stats.videos')} value={stats.videos} icon={<UIIcon name="video" size={18} />} />
                <StatCard label={t('admin.stats.pdfs')} value={stats.pdfs} icon={<UIIcon name="file" size={18} />} />
                <StatCard label={t('admin.stats.audios')} value={stats.audios} icon={<UIIcon name="music" size={18} />} highlight />
              </>
            )}
          </div>
        </div>

        <div className="admin-quick-actions">
          <h2>{t('admin.quickActions')}</h2>
          <div className="quick-actions-grid">
            <Link to="/admin/students" className="action-card">
              <div className="action-icon"><UIIcon name="plus" size={20} /></div>
              <h3>{t('admin.addStudent')}</h3>
              <p>{t('admin.addStudentDesc')}</p>
            </Link>
            <Link to="/admin/upload" className="action-card">
              <div className="action-icon"><UIIcon name="upload" size={20} /></div>
              <h3>{t('admin.createContent')}</h3>
              <p>{t('admin.createContentDesc')}</p>
            </Link>
            <Link to="/admin/content" className="action-card">
              <div className="action-icon"><UIIcon name="clipboard" size={20} /></div>
              <h3>{t('admin.manageContent')}</h3>
              <p>{t('admin.manageContentDesc')}</p>
            </Link>
            <Link to="/admin/students" className="action-card">
              <div className="action-icon"><UIIcon name="users" size={20} /></div>
              <h3>{t('admin.viewStudents')}</h3>
              <p>{t('admin.viewStudentsDesc')}</p>
            </Link>
            <a href="/admin" className="action-card" onClick={(e) => { e.preventDefault(); alert(t('admin.comingSoon.reports')); }}>
              <div className="action-icon"><UIIcon name="chart" size={20} /></div>
              <h3>{t('admin.reports')}</h3>
              <p>{t('admin.reportsDesc')}</p>
            </a>
            <a href="/admin" className="action-card" onClick={(e) => { e.preventDefault(); alert(t('admin.comingSoon.export')); }}>
              <div className="action-icon"><UIIcon name="download" size={20} /></div>
              <h3>{t('admin.export')}</h3>
              <p>{t('admin.exportDesc')}</p>
            </a>
          </div>
        </div>

        <div className="admin-recent">
          <div className="content-header">
            <h2>{t('admin.recent')}</h2>
            <button className="button button-ghost small" onClick={() => setShowShortcuts(true)} title={t('admin.shortcuts')} aria-label={t('admin.shortcuts')}>
              <UIIcon name="keyboard" size={16} /> {t('admin.shortcutsShort')}
            </button>
          </div>
          {recentContent.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true"><UIIcon name="video" size={26} /></span>
              <p>{t('admin.noContentYet')} <Link to="/admin/upload">{t('admin.addFirst')}</Link></p>
            </div>
          ) : (
            <div className="recent-list">
              {recentContent.map(item => (
                <div key={item.id} className="recent-item">
                  <div className="recent-icon"><Icon type={item.type} className="recent-icon-svg" /></div>
                  <div className="recent-info">
                    <h4>{item.title}</h4>
                    <p>{item.type.toUpperCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showShortcuts && (
        <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
};

export default AdminDashboardPage;
