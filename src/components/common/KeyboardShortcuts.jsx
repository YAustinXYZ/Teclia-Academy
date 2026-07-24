import { useEffect } from 'react';
import { usePreferences } from '../../context/PreferencesContext.jsx';

const SHORTCUT_KEYS = ['/', 'n', 'c', 'g d', 'g s', 'g c', '?'];
const SHORTCUT_MSG = {
  '/': 'shortcuts.search',
  n: 'shortcuts.add',
  c: 'shortcuts.create',
  'g d': 'shortcuts.dash',
  'g s': 'shortcuts.students',
  'g c': 'shortcuts.content',
  '?': 'shortcuts.help',
};

export const useKeyboardShortcuts = (handlers = {}) => {
  useEffect(() => {
    let buffer = '';
    const timerRef = { current: null };
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlers.showHelp?.();
        return;
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlers.focusSearch?.();
        return;
      }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlers.addStudent?.();
        return;
      }
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlers.createContent?.();
        return;
      }
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        buffer = 'g';
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { buffer = ''; }, 500);
        return;
      }
      if (buffer === 'g') {
        buffer = '';
        if (e.key === 'd') { e.preventDefault(); handlers.goDashboard?.(); }
        if (e.key === 's') { e.preventDefault(); handlers.goStudents?.(); }
        if (e.key === 'c') { e.preventDefault(); handlers.goContent?.(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handlers]);
};

export const KeyboardShortcutsHelp = ({ onClose }) => {
  const { t } = usePreferences();

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={t('shortcuts.title')}>
      <div className="modal-content keyboard-shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="slide-panel-header">
          <h2>{t('shortcuts.title')}</h2>
          <button className="slide-close" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        <div className="shortcuts-list">
          {SHORTCUT_KEYS.map((key) => (
            <div key={key} className="shortcut-row">
              <kbd className="shortcut-key">{key}</kbd>
              <span className="shortcut-desc">{t(SHORTCUT_MSG[key])}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
