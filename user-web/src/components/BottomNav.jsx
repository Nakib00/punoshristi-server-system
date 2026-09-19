import { NavLink } from 'react-router-dom';
import Icon from './Icon';

const TABS = [
  { to: '/dashboard', icon: 'home', label: 'Home' },
  { to: '/map', icon: 'map', label: 'Map' },
  { to: '/scan', icon: 'qr_code_scanner', label: 'Scan' },
  { to: '/leaderboard', icon: 'leaderboard', label: 'Ranks' },
  { to: '/profile', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 py-2 bg-surface shadow-[0px_-4px_12px_rgba(0,67,23,0.04)] rounded-t-xl">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            'flex flex-col items-center justify-center transition-opacity active:scale-90 duration-150 ' +
            (isActive
              ? 'bg-secondary-container text-on-secondary-container rounded-full px-4 py-1'
              : 'text-on-surface-variant hover:opacity-80')
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={tab.icon} filled={isActive} />
              <span className="font-label-md text-label-md">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
