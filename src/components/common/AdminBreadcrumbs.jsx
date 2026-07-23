import { Link } from 'react-router-dom';

export const AdminBreadcrumbs = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <nav className="admin-breadcrumbs" aria-label="Miga de pan">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.to && !isLast ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
              {!isLast && <span className="admin-breadcrumb-sep" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default AdminBreadcrumbs;
