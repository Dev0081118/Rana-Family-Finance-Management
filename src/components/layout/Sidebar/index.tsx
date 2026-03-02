import React, { useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  User,
  LogIn,
  LogOut,
  Settings,
} from 'lucide-react';
import { NavItem } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
  collapsed: boolean;
  isMobile: boolean;
  isTablet: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const navItems: NavItem[] = [
  { id: 'income', label: 'Income', icon: <TrendingUp size={20} />, path: '/income' },
  { id: 'expenses', label: 'Expenses', icon: <TrendingDown size={20} />, path: '/expenses' },
  { id: 'savings', label: 'Savings', icon: <PiggyBank size={20} />, path: '/savings' },
  { id: 'investments', label: 'Investments', icon: <Wallet size={20} />, path: '/investments' },
];

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  isMobile,
  isTablet,
  mobileOpen,
  onToggle,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle touch swipe to close on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX > 50) return; // Only handle swipes from left edge
    
    // Store initial touch position
    const startX = touch.clientX;
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const currentX = moveEvent.touches[0].clientX;
      if (currentX - startX > 50) { // Swipe right threshold
        onClose();
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [onClose]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        onClose();
      }
    };

    if (mobileOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileOpen, onClose]);

  // Determine sidebar state classes
  const sidebarClasses = [
    styles.sidebar,
    collapsed ? styles.collapsed : '',
    isMobile && mobileOpen ? styles.mobileOpen : '',
    isTablet && !collapsed ? styles.tabletOpen : '',
  ].filter(Boolean).join(' ');

  return (
    <aside
      className={sidebarClasses}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      aria-label="Navigation sidebar"
      aria-hidden={!mobileOpen && isMobile}
    >
      <div className={styles.sidebarHeader}>
        <div className={styles.logo} onClick={onToggle} role="button" tabIndex={0}>
          <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className={styles.logoText}>Family Finance</span>
        </div>
      </div>

      <nav aria-label="Main navigation">
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.id} className={styles.navItem}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={() => isMobile && mobileOpen && onClose()}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge && !collapsed && <span className={styles.navBadge}>{item.badge}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        {isAuthenticated ? (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user?.name}</span>
                <span className={styles.userRole}>{user?.role}</span>
              </div>
            </div>
            <button 
              className={styles.logoutButton}
              onClick={handleLogout}
              aria-label="Log out"
            >
              <LogOut size={18} />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        ) : (
          <div className={styles.authSection}>
            <button 
              className={styles.loginButton}
              onClick={() => navigate('/login')}
              aria-label="Log in"
            >
              <LogIn size={18} />
              {!collapsed && <span>Login</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;