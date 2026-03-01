import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children: React.ReactNode;
  currentMonth: string;
  onMonthChange: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentMonth, onMonthChange }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  // Handle responsive breakpoint detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const wasMobile = isMobile;
      const nowMobile = width < 768;
      const nowTablet = width >= 768 && width < 1024;

      setIsMobile(nowMobile);
      setIsTablet(nowTablet);

      // Auto-close mobile sidebar when resizing to tablet/desktop
      if (wasMobile && !nowMobile) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const handleMenuToggle = useCallback(() => {
    if (isMobile) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  }, [isMobile]);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }

    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [mobileSidebarOpen]);

  // Determine sidebar collapsed state based on device
  const isSidebarCollapsed = isMobile ? !mobileSidebarOpen : sidebarCollapsed;

  return (
    <div className={styles.mainLayout}>
      <Sidebar
        collapsed={isSidebarCollapsed}
        isMobile={isMobile}
        isTablet={isTablet}
        mobileOpen={mobileSidebarOpen}
        onToggle={handleMenuToggle}
        onClose={closeMobileSidebar}
      />

      <Topbar
        sidebarCollapsed={isMobile ? false : sidebarCollapsed}
        onMenuToggle={handleMenuToggle}
        currentMonth={currentMonth}
        onMonthChange={onMonthChange}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <main
        className={`${styles.mainContent} ${(!isMobile && sidebarCollapsed) ? styles.mainContentFull : ''}`}
        aria-label="Main content"
      >
        <div className={styles.pageContent}>
          {children}
        </div>
      </main>

      {/* Mobile/Tablet overlay */}
      {(mobileSidebarOpen && isMobile) && (
        <div
          className={styles.mobileOverlay}
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default MainLayout;