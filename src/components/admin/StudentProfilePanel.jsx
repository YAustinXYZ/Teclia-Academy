import { UserAvatar } from '../common/UserAvatar.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { planLabel } from '../../utils/plans.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';

const InfoRow = ({ label, value }) => (
  <div className="profile-info-row">
    <span className="profile-info-label">{label}</span>
    <span className="profile-info-value">{value || '—'}</span>
  </div>
);

export const StudentProfilePanel = ({
  student,
  onClose,
  onAssignPlan,
  onSuspend,
  onDelete,
}) => {
  const { t, language } = usePreferences();
  if (!student) return null;
  const status = student.status || 'active';
  const isSuspended = status === 'suspended';
  const dateLocale = language === 'en' ? 'en-US' : 'es-CR';
  const statusLabel = status === 'active'
    ? t('status.active')
    : status === 'inactive'
      ? t('status.inactive')
      : t('status.suspended');

  return (
    <div className="slide-overlay" onClick={onClose}>
      <div className="slide-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="student-panel-title">
        <div className="slide-panel-header">
          <h2 id="student-panel-title">{t('panel.title')}</h2>
          <button type="button" className="slide-close" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>

        <div className="slide-panel-body">
          <div className="student-profile-top">
            <div className="student-profile-avatar-section">
              <UserAvatar
                name={student.name}
                avatarUrl={student.avatar_url}
                size="lg"
                className="student-profile-avatar"
                placeholderClassName="student-profile-avatar student-profile-avatar-placeholder"
              />
            </div>
            <div className="student-profile-name-section">
              <h3>{student.name}</h3>
              <p className="student-profile-email">{student.email}</p>
              <div className="student-profile-badges">
                <StatusBadge status={status} type="status" />
                <StatusBadge status={student.plan_tier || 'free'} type="plan" />
              </div>
            </div>
          </div>

          <div className="student-profile-quick-actions">
            {onAssignPlan && (
              <button type="button" className="button button-secondary small" onClick={() => onAssignPlan(student)}>
                {student.plan_tier ? t('panel.changePlan') : t('admin.assignPlan')}
              </button>
            )}
            {onSuspend && (
              <button type="button" className="button button-ghost small" onClick={() => onSuspend(student)}>
                {isSuspended ? t('admin.reactivate') : t('admin.suspend')}
              </button>
            )}
            {onDelete && (
              <button type="button" className="button button-danger small" onClick={() => onDelete(student)}>
                {t('admin.delete')}
              </button>
            )}
          </div>

          <div className="student-profile-section">
            <h4>{t('panel.personal')}</h4>
            <InfoRow label={t('common.name')} value={student.name} />
            <InfoRow label={t('common.email')} value={student.email} />
            <InfoRow label={t('panel.username')} value={student.username} />
            <InfoRow label="ID" value={student.id} />
            <InfoRow
              label={t('panel.joined')}
              value={student.created_at ? new Date(student.created_at).toLocaleDateString(dateLocale) : '—'}
            />
          </div>

          <div className="student-profile-section">
            <h4>{t('panel.planStatus')}</h4>
            <InfoRow label={t('admin.currentPlan')} value={planLabel(student.plan_tier, t)} />
            <InfoRow label={t('common.status')} value={statusLabel} />
            <InfoRow label={t('panel.skill')} value={student.skill_level || t('panel.beginner')} />
            <InfoRow label={t('panel.progress')} value={student.progress ? `${student.progress}%` : '—'} />
          </div>

          <div className="student-profile-section">
            <h4>{t('panel.courses')}</h4>
            <InfoRow label={t('panel.enrolled')} value={(student.enrolled_courses_count ?? (student.enrolled_courses || []).length) || '—'} />
            <InfoRow label={t('panel.teachers')} value={(student.assigned_teachers_count ?? (student.assigned_teachers || []).length) || '—'} />
            <InfoRow label={t('panel.assignments')} value={student.completed_assignments ?? '—'} />
            <InfoRow label={t('panel.attendance')} value={student.attendance_rate ? `${student.attendance_rate}%` : '—'} />
          </div>

          {student.teacher_notes && (
            <div className="student-profile-section">
              <h4>{t('panel.notes')}</h4>
              <p className="student-profile-notes">{student.teacher_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePanel;
