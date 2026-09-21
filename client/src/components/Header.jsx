import { useSelector, useDispatch } from 'react-redux';
import { setActiveView } from '../store/uiSlice.js';
import { useCallback } from 'react';

function Header() {
  const activeView = useSelector((state) => state.ui.activeView);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  }, []);

  const isAdmin = user && (user.role === 'SUPER_ADMIN' || user.role === 'MUNICIPAL_ADMIN');

  return (
    <header
      className="sticky top-0 z-50"
      style={{ backgroundColor: 'var(--navy)' }}
    >
      <div className="mx-auto flex max-w-[1040px] items-center justify-between px-5 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-[30px] w-[30px] items-center justify-center text-sm font-bold"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--on-accent)',
              borderRadius: '9px',
            }}
          >
            M
          </div>
          <span className="text-[15px] font-bold text-white">
            Smart Municipal
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Segmented control */}
          <div
            className="flex overflow-hidden"
            style={{
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            {['citizen', 'officer'].map((view) => (
              <button
                key={view}
                onClick={() => dispatch(setActiveView(view))}
                className="px-4 py-1.5 text-[13px] font-medium text-white transition-colors"
                style={{
                  backgroundColor:
                    activeView === view ? 'var(--primary)' : 'transparent',
                }}
              >
                {view === 'citizen' ? 'Citizen' : 'Officer'}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => window.location.href = '/admin/structure'}
                className="px-4 py-1.5 text-[13px] font-medium text-white transition-colors border-l"
                style={{
                  backgroundColor: window.location.pathname.startsWith('/admin') ? 'var(--primary)' : 'transparent',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                Admin
              </button>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 text-[13px] font-medium transition-colors"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')
            }
          >
            Theme
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
