import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, Calendar, ChevronDown } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
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
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`${styles.monthSelectorWrapper}`)) {
        setShowMonthDropdown(false);
      }
    };

    if (showMonthDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMonthDropdown]);

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

        <div className={styles.userProfile} role="button" tabIndex={0}>
          <div className={styles.userAvatar}>JD</div>
          {(!isMobile || isTablet) && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>John Doe</span>
              <span className={styles.userRole}>Admin</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
