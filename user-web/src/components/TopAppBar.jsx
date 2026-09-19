import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import Icon from './Icon';

export default function TopAppBar({ showBack = false, title, transparent = false }) {
  const navigate = useNavigate();

  return (
    <header
      className={
        'fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-margin-mobile h-16 w-full ' +
        (transparent ? '' : 'bg-surface shadow-sm')
      }
    >
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors active:scale-95"
          >
            <Icon name="arrow_back" className="text-primary" />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container shrink-0">
            <img alt="Punoshristi logo" className="w-full h-full object-cover" src={logo} />
          </div>
        )}
        <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
          {title || 'Punoshristi'}
        </span>
      </div>
      <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors active:scale-95">
        <Icon name="notifications" className="text-on-surface-variant" />
      </button>
    </header>
  );
}
