import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, isActive, onClick }) => (
  <Link
    to={to}
    className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
  >
    {children}
  </Link>
);

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({ isOpen, onClick }) => (
  <button
    type="button"
    className="inline-flex items-center justify-center rounded-lg p-2.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
    onClick={onClick}
    aria-expanded={isOpen}
    aria-controls="mobile-menu"
    aria-label={isOpen ? 'Close menu' : 'Open menu'}
  >
    <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
    <svg 
      className="h-6 w-6" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth="1.5" 
      stroke="currentColor" 
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d={isOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} 
      />
    </svg>
  </button>
);

interface LogoProps {
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ onClick }) => (
  <Link 
    to="/" 
    className="flex items-center gap-x-2 -m-1.5 p-1.5"
    onClick={onClick}
    aria-label="Bleu.js Home"
  >
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white font-bold text-lg">
      B
    </div>
    <span className="text-lg font-semibold text-gray-900">
      Bleu.js
    </span>
  </Link>
);

interface AuthButtonsProps {
  user: any;
  logout: () => void;
  onMobileMenuClick?: () => void;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ user, logout, onMobileMenuClick }) => (
  user ? (
    <div className="flex items-center gap-x-4">
      <span className="text-sm font-medium text-gray-700">
        {user.email}
      </span>
      <button
        onClick={logout}
        className="btn-secondary"
        aria-label="Sign out"
      >
        Sign out
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-x-4">
      <Link 
        to="/signin" 
        className="btn-secondary"
        onClick={onMobileMenuClick}
        aria-label="Sign in"
      >
        Sign in
      </Link>
      <Link 
        to="/signup" 
        className="btn-primary"
        onClick={onMobileMenuClick}
        aria-label="Sign up"
      >
        Sign up
      </Link>
    </div>
  )
);

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  logout: () => void;
  isActive: (path: string) => boolean;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, user, logout, isActive }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile menu"
    >
      <div 
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white sm:max-w-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Logo onClick={onClose} />
            <MobileMenuButton isOpen={true} onClick={onClose} />
          </div>

          <div className="space-y-1 mb-6">
            <NavLink to="/" isActive={isActive('/')} onClick={onClose}>
              Home
            </NavLink>
            <NavLink to="/pricing" isActive={isActive('/pricing')} onClick={onClose}>
              Pricing
            </NavLink>
            {user && (
              <NavLink to="/dashboard" isActive={isActive('/dashboard')} onClick={onClose}>
                Dashboard
              </NavLink>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <AuthButtons user={user} logout={logout} onMobileMenuClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Global">
          <div className="flex h-16 items-center justify-between">
            <div className="flex lg:flex-1">
              <Logo />
            </div>

            <div className="flex lg:hidden">
              <MobileMenuButton 
                isOpen={mobileMenuOpen} 
                onClick={() => setMobileMenuOpen(true)} 
              />
            </div>

            <div className="hidden lg:flex lg:gap-x-8">
              <NavLink to="/" isActive={isActive('/')}>
                Home
              </NavLink>
              <NavLink to="/pricing" isActive={isActive('/pricing')}>
                Pricing
              </NavLink>
              {user && (
                <NavLink to="/dashboard" isActive={isActive('/dashboard')}>
                  Dashboard
                </NavLink>
              )}
            </div>

            <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
              <AuthButtons user={user} logout={logout} />
            </div>
          </div>
        </nav>
      </div>

      <MobileMenu 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        logout={logout}
        isActive={isActive}
      />
    </header>
  );
};

export default Navbar; 