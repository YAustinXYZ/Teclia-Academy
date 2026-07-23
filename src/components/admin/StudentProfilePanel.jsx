import { UserAvatar } from '../common/UserAvatar.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { planLabel } from '../../utils/plans.js';

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
  if (!student) return null;
  const status = student.status || 'active';
  const isSuspended = status === 'suspended';

  return (
    <div className="slide-overlay" onClick={onClose}>
      <div className="slide-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="student-panel-title">
        <div className="slide-panel-header">
          <h2 id="student-panel-title">Detalle del estudiante</h2>
          <button type="button" className="slide-close" onClick={onClose} aria-label="Cerrar">✕</button>
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
                {student.plan_tier ? 'Cambiar plan' : 'Asignar plan'}
              </button>
            )}
            {onSuspend && (
              <button type="button" className="button button-ghost small" onClick={() => onSuspend(student)}>
                {isSuspended ? 'Reactivar' : 'Suspender'}
              </button>
            )}
            {onDelete && (
              <button type="button" className="button button-danger small" onClick={() => onDelete(student)}>
                Eliminar
              </button>
            )}
          </div>

          <div className="student-profile-section">
            <h4>Información personal</h4>
            <InfoRow label="Nombre" value={student.name} />
            <InfoRow label="Correo" value={student.email} />
            <InfoRow label="Usuario" value={student.username} />
            <InfoRow label="ID" value={student.id} />
            <InfoRow label="Fecha de registro" value={student.created_at ? new Date(student.created_at).toLocaleDateString('es-CR') : '—'} />
          </div>

          <div className="student-profile-section">
            <h4>Plan y estado</h4>
            <InfoRow label="Plan actual" value={planLabel(student.plan_tier)} />
            <InfoRow label="Estado" value={status === 'active' ? 'Activo' : status === 'inactive' ? 'Inactivo' : 'Suspendido'} />
            <InfoRow label="Nivel de piano" value={student.skill_level || 'Principiante'} />
            <InfoRow label="Progreso" value={student.progress ? `${student.progress}%` : '—'} />
          </div>

          <div className="student-profile-section">
            <h4>Cursos y asignaciones</h4>
            <InfoRow label="Cursos inscritos" value={(student.enrolled_courses_count ?? (student.enrolled_courses || []).length) || '—'} />
            <InfoRow label="Profesores asignados" value={(student.assigned_teachers_count ?? (student.assigned_teachers || []).length) || '—'} />
            <InfoRow label="Tareas completadas" value={student.completed_assignments ?? '—'} />
            <InfoRow label="Asistencia" value={student.attendance_rate ? `${student.attendance_rate}%` : '—'} />
          </div>

          {student.teacher_notes && (
            <div className="student-profile-section">
              <h4>Notas del profesor</h4>
              <p className="student-profile-notes">{student.teacher_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePanel;
