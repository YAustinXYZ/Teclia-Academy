import { useEffect, useState } from 'react';
import { authService } from '../../services/api.js';
import { resolveAvatar } from '../../utils/avatar.js';
import { planLabel, STUDENT_PLANS } from '../../utils/plans.js';

export const AdminStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadStudents = () => {
    setLoading(true);
    setError(null);
    authService
      .getStudents()
      .then((res) => setStudents(res.data.students || []))
      .catch((err) => setError(err.response?.data?.error || 'No se pudo cargar la lista de estudiantes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handlePlanChange = async (studentId, planTier) => {
    setUpdatingId(studentId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await authService.updateStudentPlan(studentId, planTier || null);
      setStudents((prev) =>
        prev.map((s) => (Number(s.id) === Number(studentId) ? res.data.student : s))
      );
      setSuccessMessage(res.data.message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar el plan.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteStudent = async (student) => {
    const confirmed = window.confirm(
      `¿Eliminar la cuenta de ${student.name} (${student.email})? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(student.id);
    setError(null);
    setSuccessMessage(null);
    try {
      await authService.deleteStudent(student.id);
      setStudents((prev) => prev.filter((s) => Number(s.id) !== Number(student.id)));
      setSuccessMessage('Cuenta eliminada correctamente.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo eliminar la cuenta.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Estudiantes registrados</h1>
          <p>Gestiona alumnos, asigna planes premium y consulta sus datos.</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {loading ? (
          <p className="section-copy">Cargando estudiantes...</p>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <p>No hay estudiantes registrados todavía.</p>
            <button type="button" className="button button-secondary" onClick={loadStudents}>
              Recargar lista
            </button>
          </div>
        ) : (
          <div className="students-panel">
            <div className="students-summary">
              <span className="students-count">{students.length}</span>
              <span>estudiante{students.length !== 1 ? 's' : ''} en total</span>
            </div>
            <div className="content-table-wrapper">
              <table className="content-table students-table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Plan actual</th>
                    <th>Asignar plan</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const avatarSrc = resolveAvatar(student.avatar_url || '');
                    const currentPlan = student.plan_tier || '';
                    return (
                      <tr key={student.id}>
                        <td>
                          {avatarSrc ? (
                            <img src={avatarSrc} alt={student.name} className="student-table-avatar" loading="lazy" decoding="async" width={40} height={40} />
                          ) : (
                            <span className="student-table-avatar student-table-avatar-placeholder">
                              {student.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </td>
                        <td className="td-title">{student.name}</td>
                        <td>{student.email}</td>
                        <td>
                          <span className={`role-badge role-badge-${student.plan_tier || 'student'}`}>
                            {planLabel(student.plan_tier)}
                          </span>
                        </td>
                        <td>
                          <div className="plan-assign-cell">
                            {STUDENT_PLANS.map((plan) => (
                              <button
                                key={plan.value || 'none'}
                                type="button"
                                className={`plan-assign-btn ${currentPlan === plan.value ? 'active' : ''}`}
                                disabled={updatingId === student.id || deletingId === student.id}
                                onClick={() => handlePlanChange(student.id, plan.value)}
                              >
                                {plan.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          {student.created_at
                            ? new Date(student.created_at).toLocaleDateString('es-CR')
                            : '—'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="button button-danger small"
                            disabled={deletingId === student.id}
                            onClick={() => handleDeleteStudent(student)}
                          >
                            {deletingId === student.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentsPage;
