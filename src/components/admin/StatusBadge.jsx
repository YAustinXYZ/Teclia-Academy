import { usePreferences } from '../../context/PreferencesContext.jsx';

export const StatusBadge = ({ status, type = 'status' }) => {
  const { t } = usePreferences();

  if (type === 'plan') {
    const planStyles = {
      free: 'badge-plan badge-plan-free',
      basico: 'badge-plan badge-plan-basico',
      pro: 'badge-plan badge-plan-pro',
      master: 'badge-plan badge-plan-master',
    };
    const tier = status || 'free';
    const planKeys = {
      free: 'plan.free',
      basico: 'plan.basico',
      pro: 'plan.pro',
      master: 'plan.master',
    };
    return (
      <span className={planStyles[tier] || 'badge-plan badge-plan-free'}>
        {planKeys[tier] ? t(planKeys[tier]) : tier}
      </span>
    );
  }

  if (type === 'content-type') {
    const typeStyles = {
      video: 'badge badge-type badge-type-video',
      pdf: 'badge badge-type badge-type-pdf',
      audio: 'badge badge-type badge-type-audio',
      image: 'badge badge-type badge-type-image',
    };
    return (
      <span className={typeStyles[status] || 'badge badge-type'}>
        {(status || '').toUpperCase()}
      </span>
    );
  }

  if (type === 'publish-status') {
    const pub = status === 'published' ? 'published' : 'draft';
    return (
      <span className={`badge badge-publish badge-publish-${pub}`}>
        {pub === 'published' ? t('status.published') : t('status.draft')}
      </span>
    );
  }

  const statusStyles = {
    active: 'badge-status badge-status-active',
    inactive: 'badge-status badge-status-inactive',
    suspended: 'badge-status badge-status-suspended',
    pending: 'badge-status badge-status-pending',
    graduated: 'badge-status badge-status-graduated',
  };
  const statusKeys = {
    active: 'status.active',
    inactive: 'status.inactive',
    suspended: 'status.suspended',
    pending: 'status.pending',
    graduated: 'status.graduated',
  };
  return (
    <span className={statusStyles[status] || 'badge-status badge-status-inactive'}>
      {statusKeys[status] ? t(statusKeys[status]) : (status || t('status.unknown'))}
    </span>
  );
};

export default StatusBadge;
