import React, { useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BarChart3,
  User,
  Wallet,
} from 'lucide-react';
import { NavItem } from '../../../types';
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
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { id: 'income', label: 'Income', icon: <TrendingUp size={20} />, path: '/income' },
  { id: 'expenses', label: 'Expenses', icon: <TrendingDown size={20} />, path: '/expenses' },
  { id: 'savings', label: 'Savings', icon: <PiggyBank size={20} />, path: '/savings' },
  { id: 'investments', label: 'Investments', icon: <Wallet size={20} />, path: '/investments' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, path: '/analytics' },
  { id: 'profile', label: 'Profile', icon: <User size={20} />, path: '/profile' },
];

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  isMobile,
  isTablet,
  mobileOpen,
  onToggle,
  onClose,
}) => {
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
                end={item.id === 'dashboard'}
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
        {/* Footer content can be added here */}
      </div>
    </aside>
  );
};

export default Sidebar;