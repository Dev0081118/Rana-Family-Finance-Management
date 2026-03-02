import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, Menu, Calendar, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Topbar.module.css';

interface TopbarProps {
  sidebarCollapsed: boolean;
  onMenuToggle: () => void;
  currentMonth: string;
  onMonthChange: () => void;
  isMobile: boolean;
  isTablet: boolean;
}

const Topbar: React.FC<TopbarProps> = ({
  sidebarCollapsed,
  onMenuToggle,
  currentMonth,
  onMonthChange,
  isMobile,
  isTablet,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const currentUser = user;
  
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`${styles.monthSelectorWrapper}`)) {
        setShowMonthDropdown(false);
      }
      if (!target.closest(`${styles.userProfile}`)) {
        setShowUserDropdown(false);
      }
    };

    if (showMonthDropdown || showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMonthDropdown, showUserDropdown]);

  const handleMonthClick = () => {
    if (isMobile) {
      setShowMonthDropdown(!showMonthDropdown);
    } else {
      onMonthChange();
    }
  };

  const handleMonthSelect = () => {
    setShowMonthDropdown(false);
    onMonthChange();
  };

  // Determine topbar classes based on state
  const topbarClasses = [
    styles.topbar,
    sidebarCollapsed ? styles.topbarFull : '',
    isMobile ? styles.mobile : '',
    isTablet ? styles.tablet : '',
  ].filter(Boolean).join(' ');

  return (
    <header className={topbarClasses}>
      <div className={styles.topbarLeft}>
        <button
          className={styles.mobileMenuToggle}
          onClick={onMenuToggle}
          aria-label={isMobile ? "Open navigation menu" : "Toggle sidebar"}
          aria-expanded={isMobile ? undefined : !sidebarCollapsed}
        >
          <Menu className={styles.mobileMenuIcon} size={20} />
        </button>

        <h1 className={`${styles.appTitle} ${isMobile ? styles.appTitleMobile : ''}`}>
          Family Finance
        </h1>

        <div className={styles.monthSelectorWrapper}>
          <button
            className={styles.monthSelector}
            onClick={handleMonthClick}
            aria-expanded={showMonthDropdown}
            aria-haspopup="true"
          >
            <Calendar className={styles.monthSelectorIcon} size={16} />
            <span className={styles.monthText}>{currentMonth}</span>
            {isMobile && <ChevronDown className={styles.chevronIcon} size={14} />}
          </button>

          {/* Mobile month dropdown */}
          {showMonthDropdown && isMobile && (
            <div className={styles.monthDropdown} role="menu">
              <button className={styles.monthOption} onClick={handleMonthSelect}>
                January 2024
              </button>
              <button className={styles.monthOption} onClick={handleMonthSelect}>
                February 2024
              </button>
              <button className={styles.monthOption} onClick={handleMonthSelect}>
                March 2024
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.topbarRight}>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className={styles.themeToggleIcon} size={20} />
          ) : (
            <Sun className={styles.themeToggleIcon} size={20} />
          )}
        </button>

        <div className={styles.userProfile} role="button" tabIndex={0} onClick={() => setShowUserDropdown(!showUserDropdown)}>
          <div className={styles.userAvatar}>
            {currentUser ? getUserInitials(currentUser.name) : 'JD'}
          </div>
          {(!isMobile || isTablet) && (
            <div className={styles.userInfo}>
             <span className={styles.userName}>
               {currentUser?.name || 'User'}
             </span>
             <span className={styles.userRole}>
               {currentUser?.role === 'admin' ? 'Admin' : 'Member'}
             </span>
            </div>
          )}
          <ChevronDown className={styles.chevronIcon} size={14} />
        </div>

        {/* User dropdown */}
        {showUserDropdown && (
          <div className={styles.userDropdown} role="menu">
            <button className={styles.userDropdownItem} onClick={() => navigate('/profile')}>
              <User size={16} />
              Profile
            </button>
            <button className={styles.userDropdownItem} onClick={() => navigate('/profile')}>
              <Settings size={16} />
              Settings
            </button>
            <div className={styles.userDropdownDivider}></div>
            <button className={styles.userDropdownItem} onClick={() => {
              logout();
              navigate('/login');
            }}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
