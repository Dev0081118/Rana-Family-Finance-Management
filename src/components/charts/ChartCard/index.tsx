import React from 'react';
import styles from './ChartCard.module.css';

interface ChartCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
  fullHeight?: boolean;
  actions?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  fullHeight = false,
  actions,
}) => {
  const chartClasses = [
    styles.chartCard,
    fullHeight ? styles.chartFullHeight : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={chartClasses}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>{title}</h3>
          {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.chartActions}>{actions}</div>}
      </div>
      <div className={styles.chartBody}>{children}</div>
    </div>
  );
};

export default ChartCard;