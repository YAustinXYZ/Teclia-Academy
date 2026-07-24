import { useEffect, useRef } from 'react';
import { usePreferences } from '../../context/PreferencesContext.jsx';

export const ConfirmDialog = ({ title, message, confirmLabel, onConfirm, onCancel, destructive = true }) => {
  const confirmRef = useRef(null);
  const { t } = usePreferences();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', handleKeyDown);
    confirmRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="modal-content confirm-dialog">
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="button button-secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={`button ${destructive ? 'button-danger' : 'button-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel || t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
