import { useState } from 'react';
import { studentPlanOptions } from '../../utils/plans.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';

export const PlanAssignModal = ({ student, currentPlan, onSave, onCancel }) => {
  const { t } = usePreferences();
  const plans = studentPlanOptions(t);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan || '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentLabel = plans.find((p) => p.value === currentPlan)?.label || t('plan.none');

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await onSave(student.id, selectedPlan);
      const nextLabel = plans.find((p) => p.value === selectedPlan)?.label || t('plan.none');
      setFeedback({ type: 'success', message: t('admin.planUpdated', { plan: nextLabel }) });
      setTimeout(() => onCancel(), 1500);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || t('admin.statusFail') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
      <div className="modal-content plan-assign-modal">
        <h2 id="plan-modal-title">{t('admin.assignPlan')} — {student.name}</h2>

        <div className="plan-assign-current">
          <span className="plan-assign-current-label">{t('admin.currentPlan')}:</span>
          <span className="plan-assign-current-value">{currentLabel}</span>
        </div>

        <div className="form-group">
          <label htmlFor="plan-select">{t('admin.assignPlan')}</label>
          <select
            id="plan-select"
            className="plan-select"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            disabled={saving}
          >
            {plans.map((plan) => (
              <option key={plan.value || 'none'} value={plan.value}>
                {plan.label}
              </option>
            ))}
          </select>
        </div>

        {feedback && (
          <div className={`plan-feedback plan-feedback-${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        <div className="confirm-dialog-actions">
          <button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button type="button" className="button button-primary" onClick={handleSave} disabled={saving}>
            {saving ? t('profile.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanAssignModal;
