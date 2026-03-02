import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'var(--color-primary)', 
  className = '' 
}) => {
  return (
    <div className={`${styles.spinnerContainer} ${className}`}>
      <div 
        className={`${styles.spinner} ${styles[size]}`}
        style={{ borderColor: `${color} transparent ${color} transparent` }}
      />
      <span className={styles.visuallyHidden}>Loading...</span>
    </div>
  );
};

export default LoadingSpinner;