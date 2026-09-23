import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { useCallback, useState, useEffect, useRef } from 'react';

function Header() {
  const activeView = useSelector((state) => state.ui.activeView);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  }, []);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    setDrawerOpen(false);
  };

  // Close drawer on ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    if (drawerOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // Close drawer on route change (via location)
  useEffect(() => {
    setDrawerOpen(false);
  }, []);

  const isAdmin = user && (user.role === 'SUPER_ADMIN' || user.role === 'MUNICIPAL_ADMIN');

  const navItems = [];
  if (user) {
    navItems.push({ label: 'Dashboard', href: '/dashboard-router' });
    if (isAdmin) {
      navItems.push({ label: 'Urban Admin', href: '/admin/structure' });
      navItems.push({ label: 'Rural Admin', href: '/admin/gram-panchayats' });
      navItems.push({ label: 'Postal Admin', href: '/admin/pincodes' });
    }
  }

  const navigateTo = (href) => {
    window.location.href = href;
    setDrawerOpen(false);
  };

  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{ backgroundColor: 'var(--navy)' }}
      >
        <div className="mx-auto flex max-w-[1040px] items-center justify-between px-3 sm:px-5 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-[30px] w-[30px] items-center justify-center text-sm font-bold shrink-0"
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

          {/* Desktop nav — hidden on mobile */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-[13px] font-medium text-white/80">
                  {user.role.replace('_', ' ')}
                </div>

                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => navigateTo(item.href)}
                    className="px-3 py-1.5 text-[13px] font-medium text-white transition-colors"
                    style={{
                      backgroundColor: window.location.pathname === item.href ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px'
                    }}
                  >
                    {item.label}
                  </button>
                ))}

                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 text-[13px] font-medium text-red-300 transition-colors hover:text-red-100"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 text-[13px] font-medium transition-colors"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              aria-label="Toggle theme"
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)')
              }
            >
              Theme
            </button>
          </div>

          {/* Mobile controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-10 w-10 rounded-lg text-white/70 active:bg-white/10"
              aria-label="Toggle theme"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            </button>
            {user && (
              <button
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="flex items-center justify-center h-10 w-10 rounded-lg text-white active:bg-white/10"
                aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={drawerOpen}
                aria-controls="mobile-nav-drawer"
              >
                {drawerOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay + panel */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <nav
            id="mobile-nav-drawer"
            ref={drawerRef}
            className="fixed top-0 right-0 h-full w-[280px] max-w-[calc(100vw-3rem)] flex flex-col shadow-2xl animate-slide-in-right"
            style={{ backgroundColor: 'var(--navy)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div className="text-white font-semibold text-[14px]">{user?.firstName} {user?.lastName}</div>
                <div className="text-white/60 text-[12px]">{user?.role?.replace('_', ' ')}</div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center h-9 w-9 rounded-lg text-white/70 active:bg-white/10"
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => navigateTo(item.href)}
                  className="w-full text-left px-4 py-3.5 text-[14px] font-medium text-white/90 transition-colors active:bg-white/10 flex items-center gap-3"
                  style={{
                    backgroundColor: window.location.pathname === item.href ? 'rgba(37, 99, 235, 0.3)' : 'transparent',
                    borderLeft: window.location.pathname === item.href ? '3px solid var(--primary)' : '3px solid transparent',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Bottom actions */}
            <div className="px-4 py-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-3 rounded-lg text-[14px] font-medium text-red-300 active:bg-red-900/30 transition-colors"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export default Header;
