import React from 'react';
import { Search } from 'lucide-react';
import styles from './FilterBar.module.css';

interface FilterBarProps {
  children?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
}

const FilterBar: React.FC<FilterBarProps> = ({
  children,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions,
}) => {
  return (
    <div className={styles.filterBar}>
      <div className={styles.filterGroup}>
        {onSearchChange && (
          <div className={styles.filterGroup} style={{ flex: 1 }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className={styles.filterSearch}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className={styles.filterGroup}>
        {children}
      </div>

      {actions && <div className={styles.filterActions}>{actions}</div>}
    </div>
  );
};

export default FilterBar;