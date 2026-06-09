import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: '📊 ওভারভিউ', end: true },
  { to: '/users', label: '👤 ইউজারগণ' },
  { to: '/machines', label: '🏭 মেশিন ও লোকেশন' },
  { to: '/scans', label: '🧾 জমার ইতিহাস' },
];

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>♻️ পুনঃসৃষ্টি</h2>
          <p>অ্যাডমিন প্যানেল</p>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
