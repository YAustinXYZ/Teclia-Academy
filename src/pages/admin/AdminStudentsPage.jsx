import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api.js';
import { STUDENT_PLANS } from '../../utils/plans.js';
import { useToast } from '../../context/ToastContext.jsx';
import { UserAvatar } from '../../components/common/UserAvatar.jsx';
import { AdminBreadcrumbs } from '../../components/common/AdminBreadcrumbs.jsx';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog.jsx';
import { PlanAssignModal } from '../../components/admin/PlanAssignModal.jsx';
import { StatusBadge } from '../../components/admin/StatusBadge.jsx';
import { StudentProfilePanel } from '../../components/admin/StudentProfilePanel.jsx';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '../../components/common/KeyboardShortcuts.jsx';
import { exportStudentsToCsv } from '../../utils/csv.js';
import { UIIcon } from '../../components/common/Icons.jsx';

const ITEMS_PER_PAGE = 20;

const FILTER_CHIPS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'suspended', label: 'Suspendidos' },
  { value: 'has_plan', label: 'Con plan' },
  { value: 'no_plan', label: 'Sin plan' },
];

const sortStudents = (students, sortKey, sortDir) => {
  return [...students].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];
    if (sortKey === 'plan_tier') {
      aVal = a.plan_tier || '';
      bVal = b.plan_tier || '';
    }
    if (sortKey === 'created_at') {
      aVal = a.created_at || '';
      bVal = b.created_at || '';
    }
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
};

export const AdminStudentsPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [planTarget, setPlanTarget] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const toast = useToast();

  useKeyboardShortcuts({
    focusSearch: () => document.querySelector('.search-input')?.focus(),
    showHelp: () => setShowShortcuts((p) => !p),
    addStudent: () => toast.success('Funcionalidad próximamente: añadir estudiante'),
    createContent: () => navigate('/admin/upload'),
    goDashboard: () => navigate('/admin'),
    goStudents: () => navigate('/admin/students'),
    goContent: () => navigate('/admin/content'),
  });

  const loadStudents = () => {
    setLoading(true);
    setError(null);
    authService
      .getStudents()
      .then((res) => setStudents(res.data.students || []))
      .catch((err) => {
        const msg = err.response?.data?.error || 'No se pudo cargar la lista de estudiantes.';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    let result = students;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.username || '').toLowerCase().includes(q) ||
        (String(s.id) || '').includes(q)
      );
    }
    if (statusFilter !== 'all') {
      const s = statusFilter;
      result = result.filter((st) => {
        const currentStatus = st.status || 'active';
        if (s === 'active') return currentStatus === 'active';
        if (s === 'inactive') return currentStatus === 'inactive' || currentStatus === 'pending';
        if (s === 'suspended') return currentStatus === 'suspended';
        if (s === 'has_plan') return !!st.plan_tier;
        if (s === 'no_plan') return !st.plan_tier;
        return true;
      });
    }
    return sortStudents(result, sortKey, sortDir);
  }, [students, search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStudents = filteredStudents.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(pageStudents.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      if (action === 'activate') {
        await Promise.all(ids.map((id) => authService.updateStudentStatus(id, 'active')));
        setStudents((prev) => prev.map((s) => ids.includes(s.id) ? { ...s, status: 'active' } : s));
        toast.success(`${ids.length} estudiante(s) activado(s)`);
      } else if (action === 'deactivate') {
        await Promise.all(ids.map((id) => authService.updateStudentStatus(id, 'inactive')));
        setStudents((prev) => prev.map((s) => ids.includes(s.id) ? { ...s, status: 'inactive' } : s));
        toast.success(`${ids.length} estudiante(s) desactivado(s)`);
      } else if (action === 'delete') {
        await Promise.all(ids.map((id) => authService.deleteStudent(id)));
        setStudents((prev) => prev.filter((s) => !ids.includes(s.id)));
        toast.success(`${ids.length} estudiante(s) eliminado(s)`);
      }
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err.response?.data?.error || `Error al ejecutar acción en lote`);
    }
  };

  const handleDeleteStudent = async (student) => {
    setUpdatingId(student.id);
    try {
      await authService.deleteStudent(student.id);
      setStudents((prev) => prev.filter((s) => Number(s.id) !== Number(student.id)));
      toast.success(`Estudiante ${student.name} eliminado correctamente`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar el estudiante');
    } finally {
      setUpdatingId(null);
      setDeleteTarget(null);
    }
  };

  const handleSuspendStudent = async (student) => {
    setUpdatingId(student.id);
    try {
      const newStatus = student.status === 'suspended' ? 'active' : 'suspended';
      await authService.updateStudentStatus(student.id, newStatus);
      setStudents((prev) =>
        prev.map((s) => Number(s.id) === Number(student.id) ? { ...s, status: newStatus } : s)
      );
      toast.success(newStatus === 'suspended' ? 'Estudiante suspendido' : 'Estudiante reactivado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo actualizar el estado');
    } finally {
      setUpdatingId(null);
      setSuspendTarget(null);
    }
  };

  const handlePlanSave = async (studentId, planTier) => {
    const res = await authService.updateStudentPlan(studentId, planTier || null);
    setStudents((prev) =>
      prev.map((s) => (Number(s.id) === Number(studentId) ? res.data.student : s))
    );
    toast.success(`Plan actualizado a ${STUDENT_PLANS.find(p => p.value === planTier)?.label || 'Sin plan'}`);
  };

  const SortHeader = ({ label, sortKey: sk }) => (
    <th className="sortable-th" onClick={() => handleSort(sk)} role="columnheader" aria-sort={sortKey === sk ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleSort(sk)}>
      {label} {sortKey === sk ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );

  if (error && students.length === 0 && !loading) {
    return (
      <div className="dashboard-layout">
        <div className="dashboard-main">
          <div className="dashboard-header">
            <h1>Estudiantes registrados</h1>
          </div>
          <div className="error-message">{error}</div>
          <button type="button" className="button button-secondary" onClick={loadStudents}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-main">
        <div className="dashboard-header">
          <AdminBreadcrumbs
            items={[
              { label: 'Mi escuela', to: '/admin' },
              { label: 'Estudiantes' },
            ]}
          />
          <h1>Estudiantes registrados</h1>
          <p>Gestiona alumnos, asigna planes premium y consulta sus datos.</p>
        </div>

        <div className="students-toolbar">
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre, email, usuario o ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              aria-label="Buscar estudiantes"
            />
          </div>
          <div className="filter-chips" role="group" aria-label="Filtros rápidos">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className={`filter-chip ${statusFilter === chip.value ? 'active' : ''}`}
                onClick={() => { setStatusFilter(chip.value); setCurrentPage(1); }}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <button className="button button-secondary small" onClick={() => exportStudentsToCsv(filteredStudents)} title="Exportar a CSV">
            <UIIcon name="download" size={15} /> CSV
          </button>
          <button className="button button-ghost small" onClick={() => setShowShortcuts(true)} title="Atajos de teclado" aria-label="Atajos de teclado">
            <UIIcon name="keyboard" size={16} />
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className="bulk-actions-bar">
            <span className="bulk-count">{selectedIds.size} seleccionado(s)</span>
            <button className="button button-secondary small" onClick={() => handleBulkAction('activate')}>Activar</button>
            <button className="button button-secondary small" onClick={() => handleBulkAction('deactivate')}>Desactivar</button>
            <button className="button button-danger small" onClick={() => handleBulkAction('delete')}>Eliminar</button>
            <button className="button button-secondary small" onClick={() => setSelectedIds(new Set())}>Deseleccionar</button>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="skeleton-table">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="skeleton-row">
                  <div className="skeleton-line skeleton-line-sm" />
                  <div className="skeleton-line skeleton-line-md" />
                  <div className="skeleton-line skeleton-line-md" />
                  <div className="skeleton-line skeleton-line-sm" />
                  <div className="skeleton-line skeleton-line-sm" />
                  <div className="skeleton-line skeleton-line-xs" />
                </div>
              ))}
            </div>
          </div>
        ) : pageStudents.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon" aria-hidden="true"><UIIcon name="user" size={28} /></span>
            <p>{search || statusFilter !== 'all' ? 'No se encontraron estudiantes con los filtros actuales.' : 'No hay estudiantes registrados todavía.'}</p>
            {(search || statusFilter !== 'all') && (
              <button type="button" className="button button-secondary" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="students-panel">
            <div className="students-summary">
              <span className="students-count">{filteredStudents.length}</span>
              <span>estudiante{filteredStudents.length !== 1 ? 's' : ''} en total</span>
              {search && <span className="filter-hint">· filtrados por &quot;{search}&quot;</span>}
            </div>
            <div className="content-table-wrapper">
              <table className="content-table students-table">
                <thead>
                  <tr>
                    <th className="th-checkbox">
                      <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size === pageStudents.length && pageStudents.length > 0} aria-label="Seleccionar todos" />
                    </th>
                    <th>Foto</th>
                    <SortHeader label="Nombre" sortKey="name" />
                    <SortHeader label="Correo" sortKey="email" />
                    <th>Estado</th>
                    <SortHeader label="Plan" sortKey="plan_tier" />
                    <th>Asignar plan</th>
                    <SortHeader label="Registro" sortKey="created_at" />
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pageStudents.map((student) => {
                    const currentPlan = student.plan_tier || '';
                    const status = student.status || 'active';
                    const isUpdating = updatingId === student.id;
                    return (
                      <tr key={student.id} className={selectedIds.has(student.id) ? 'row-selected' : ''} style={{ cursor: 'pointer' }}>
                        <td className="td-checkbox" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(student.id)} onChange={() => handleSelectOne(student.id)} aria-label={`Seleccionar ${student.name}`} />
                        </td>
                        <td onClick={() => setProfileTarget(student)}>
                          <UserAvatar
                            name={student.name}
                            avatarUrl={student.avatar_url}
                            size="md"
                            className="student-table-avatar"
                            placeholderClassName="student-table-avatar student-table-avatar-placeholder"
                          />
                        </td>
                        <td className="td-title" onClick={() => setProfileTarget(student)}>{student.name}</td>
                        <td>{student.email}</td>
                        <td><StatusBadge status={status} type="status" /></td>
                        <td><StatusBadge status={currentPlan || 'free'} type="plan" /></td>
                        <td>
                          <button
                            type="button"
                            className="button button-ghost small"
                            disabled={isUpdating}
                            onClick={() => setPlanTarget(student)}
                          >
                            {currentPlan ? 'Cambiar' : 'Asignar'}
                          </button>
                        </td>
                        <td>
                          {student.created_at
                            ? new Date(student.created_at).toLocaleDateString('es-CR')
                            : '—'}
                        </td>
                        <td>
                          <div className="td-actions">
                            {status === 'suspended' ? (
                              <button
                                type="button"
                                className="button button-secondary small"
                                disabled={isUpdating}
                                onClick={() => setSuspendTarget(student)}
                              >
                                Reactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="button button-secondary small"
                                disabled={isUpdating}
                                onClick={() => setSuspendTarget(student)}
                              >
                                Suspender
                              </button>
                            )}
                            <button
                              type="button"
                              className="button button-danger small"
                              disabled={isUpdating}
                              onClick={() => setDeleteTarget(student)}
                            >
                              {isUpdating ? '...' : 'Eliminar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="button button-ghost small"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <span className="pagination-info">
                  Página {safePage} de {totalPages}
                </span>
                <button
                  className="button button-ghost small"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar estudiante"
          message={`¿Eliminar la cuenta de ${deleteTarget.name} (${deleteTarget.email})? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => handleDeleteStudent(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {suspendTarget && (
        <ConfirmDialog
          title={suspendTarget.status === 'suspended' ? 'Reactivar estudiante' : 'Suspender estudiante'}
          message={
            suspendTarget.status === 'suspended'
              ? `¿Reactivar la cuenta de ${suspendTarget.name}? Podrá iniciar sesión nuevamente.`
              : `Esto evitará que ${suspendTarget.name} inicie sesión. ¿Confirmar suspensión?`
          }
          confirmLabel={suspendTarget.status === 'suspended' ? 'Reactivar' : 'Suspender'}
          onConfirm={() => handleSuspendStudent(suspendTarget)}
          onCancel={() => setSuspendTarget(null)}
          destructive={suspendTarget.status !== 'suspended'}
        />
      )}

      {planTarget && (
        <PlanAssignModal
          student={planTarget}
          currentPlan={planTarget.plan_tier || ''}
          onSave={handlePlanSave}
          onCancel={() => setPlanTarget(null)}
        />
      )}

      {profileTarget && (
        <StudentProfilePanel
          student={profileTarget}
          onClose={() => setProfileTarget(null)}
          onAssignPlan={(student) => {
            setProfileTarget(null);
            setPlanTarget(student);
          }}
          onSuspend={(student) => {
            setProfileTarget(null);
            setSuspendTarget(student);
          }}
          onDelete={(student) => {
            setProfileTarget(null);
            setDeleteTarget(student);
          }}
        />
      )}

      {showShortcuts && (
        <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
};

export default AdminStudentsPage;
