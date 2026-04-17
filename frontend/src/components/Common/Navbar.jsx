import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  LogOut,
  Ticket,
  LayoutDashboard,
  Menu,
  X,
  Sun,
  Moon,
  Clapperboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const closeMenu = () => setIsMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }

    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    closeMenu();
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/');
  };

  const navLinkClass = 'site-nav-link';
  const mobileLinkClass = 'site-mobile-link';

  return (
    <nav className="site-header fixed inset-x-0 top-0 z-50">
      <div className="container-custom">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-3">
          <Link to="/" className="shrink-0" onClick={closeMenu}>
            <span className="site-brand-logo site-brand-logo-header" role="img" aria-label="ShowTimeX logo" />
          </Link>

          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-lg mx-4 xl:mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies..."
                className="site-search-input"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </form>

          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 shrink-0">
            <button
              onClick={toggleTheme}
              className="site-icon-button"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className={navLinkClass}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                )}

                <Link to="/movies" className={navLinkClass}>
                 <Clapperboard className="w-5 h-5" />
                  <span>Movies</span>
                </Link>

                <Link
                  to="/my-tickets"
                  className={navLinkClass}
                >
                  <Ticket className="w-5 h-5" />
                  <span>My Tickets</span>
                </Link>

                <div className="relative group">
                  <button className={`${navLinkClass} max-w-[14rem]`}>
                    <User className="w-5 h-5 shrink-0" />
                    <span className="truncate">{user?.name || 'User'}</span>
                  </button>

                  <div className="site-dropdown-panel absolute right-0 mt-2 w-52 rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      to="/profile"
                      className="site-mobile-link block px-4 py-3"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="site-mobile-link flex w-full items-center space-x-2 px-4 py-3 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/movies" className={navLinkClass}>
                  Movies
                </Link>
                <Link to="/login" className={navLinkClass}>
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="site-icon-button lg:hidden shrink-0"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="site-mobile-panel lg:hidden"
            >
              <div className="space-y-2 py-4">
                <div className="px-4">
                  <button
                    onClick={toggleTheme}
                    className="site-icon-button flex w-full items-center justify-between px-3 py-2"
                  >
                    <span>Theme</span>
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>

                <form onSubmit={handleSearch} className="px-4 pb-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search movies..."
                      className="site-search-input"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </form>

                <Link to="/movies" className={mobileLinkClass} onClick={closeMenu}>
                  Movies
                </Link>

                {isAuthenticated ? (
                  <>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        className={mobileLinkClass}
                        onClick={closeMenu}
                      >
                        Dashboard
                      </Link>
                    )}
                    <Link to="/my-tickets" className={mobileLinkClass} onClick={closeMenu}>
                      My Tickets
                    </Link>
                    <Link to="/profile" className={mobileLinkClass} onClick={closeMenu}>
                      Profile
                    </Link>
                    <button onClick={handleLogout} className={`${mobileLinkClass} w-full text-left`}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className={mobileLinkClass} onClick={closeMenu}>
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="btn-primary mx-4 flex justify-center"
                      onClick={closeMenu}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
