import { useState } from 'react';
import { Icon, UIIcon } from '../common/Icons.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { planLabel } from '../../utils/plans.js';
import { ContentCard } from './ContentCard.jsx';

const FILTER_VALUES = ['all', 'video', 'pdf', 'audio', 'image'];

const SkeletonCard = () => (
  <div className="skeleton-card" aria-hidden="true">
    <div className="skeleton-thumb" />
    <div className="skeleton-card-body">
      <div className="skeleton-line skeleton-line-lg" />
      <div className="skeleton-line skeleton-line-md" />
      <div className="skeleton-line skeleton-line-sm" />
    </div>
  </div>
);

export const ContentGrid = ({ content = [], onDelete, isAdmin = false, user = null, loading = false }) => {
  const [filter, setFilter] = useState('all');
  const { t } = usePreferences();

  const filteredContent = filter === 'all'
    ? content
    : content.filter((item) => item.type === filter);

  const getIcon = (type) => <Icon type={type} className="content-type-icon" />;

  return (
    <div className="content-section">
      <div className="content-header">
        <h2>{t('content.title')}</h2>
        <div className="content-filters tc-filters">
          {FILTER_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              className={`filter-btn ${filter === value ? 'active' : ''}`}
              onClick={() => setFilter(value)}
            >
              {t(`content.filter.${value}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="tc-grid">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true"><UIIcon name="music" size={26} /></span>
          <p>
            {filter === 'all'
              ? t('content.empty')
              : t('content.emptyType', { type: t(`content.filter.${filter}`) })}
          </p>
          <p className="text-muted">{t('content.emptyHint')}</p>
        </div>
      ) : isAdmin ? (
        <div className="content-table-wrapper">
          <table className="content-table">
            <thead>
              <tr>
                <th>{t('content.col.title')}</th>
                <th>{t('content.col.type')}</th>
                <th>{t('content.col.author')}</th>
                <th>{t('content.col.plan')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.map((item) => (
                <tr key={item.id} className="content-row">
                  <td className="td-title">
                    <div className="td-title-inner">
                      <span className="content-icon-inline">{getIcon(item.type)}</span>
                      <div>
                        <div className="row-title">{item.title}</div>
                        <div className="row-desc">{item.description || t('common.noDescription')}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge small">{item.type.toUpperCase()}</span></td>
                  <td>{item.uploaded_by_name}</td>
                  <td><span className="badge small">{planLabel(item.plan_tier || (item.is_free ? 'free' : 'basico'), t)}</span></td>
                  <td className="td-actions">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="button button-secondary small">{t('common.view')}</a>
                    <button type="button" onClick={() => onDelete(item.id)} className="button button-danger small">{t('common.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tc-grid">
          {filteredContent.map((item) => (
            <ContentCard key={item.id} item={item} user={user} />
          ))}
        </div>
      )}
    </div>
  );
};
