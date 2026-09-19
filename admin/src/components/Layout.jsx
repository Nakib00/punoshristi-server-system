import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext';
import Icon from './Icon';
import logo from '../assets/logo.png';

const NAV_ITEMS = [
  { to: '/', icon: 'dashboard', label: 'Overview', end: true },
  { to: '/users', icon: 'group', label: 'Users' },
  { to: '/machines', icon: 'precision_manufacturing', label: 'Machines' },
  { to: '/partners', icon: 'storefront', label: 'Partners & Offers' },
  { to: '/ads', icon: 'smart_display', label: 'Kiosk Ads' },
  { to: '/scans', icon: 'receipt_long', label: 'Deposit History' },
];

export default function Layout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="Punoshristi" className="sidebar-logo" />
          <div>
            <h2>Punoshristi</h2>
            <p>Admin Panel</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {admin?.email && <p className="admin-email">{admin.email}</p>}
          <button className="btn-ghost" onClick={handleLogout}>
            <Icon name="logout" size="18px" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
