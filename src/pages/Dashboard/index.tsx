import React from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, LineChart as LineChartIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import { getSummaryCards, getMonthlyIncomeData, getMonthlyExpenseData, getExpenseByCategory } from '../../data/mockData';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const summaryCards = getSummaryCards();
  const incomeData = getMonthlyIncomeData();
  const expenseData = getMonthlyExpenseData();
  const expenseByCategory = getExpenseByCategory();

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const renderSparkline = (data: number[]) => (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data.map((value) => ({ value }))}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke="var(--color-primary)" fill="url(#colorValue)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );

  const getIcon = (title: string) => {
    switch (title) {
      case 'Total Income':
        return <TrendingUp size={20} />;
      case 'Total Expenses':
        return <TrendingDown size={20} />;
      case 'Total Savings':
        return <PiggyBank size={20} />;
      case 'Total Investments':
        return <Wallet size={20} />;
      case 'Net Worth':
        return <LineChartIcon size={20} />;
      default:
        return <Wallet size={20} />;
    }
  };

  const getVariant = (title: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' => {
    switch (title) {
      case 'Total Income':
        return 'success';
      case 'Total Expenses':
        return 'danger';
      case 'Total Savings':
        return 'primary';
      case 'Total Investments':
        return 'warning';
      case 'Net Worth':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Dashboard</h1>
        <p className={styles.dashboardSubtitle}>Your financial overview at a glance</p>
      </header>

      <div className={styles.summaryGrid}>
        {summaryCards.map((card, idx) => (
          <Card key={idx} variant={getVariant(card.title)} className={styles.summaryCard}>
            <div className={styles.summaryCardHeader}>
              <h3 className={styles.summaryCardTitle}>{card.title}</h3>
              <div className={styles.summaryCardIcon}>{getIcon(card.title)}</div>
            </div>
            <p className={styles.summaryCardValue}>{formatCurrency(card.value)}</p>
            <div className={`${styles.summaryCardChange} ${card.changeType}`}>
              {card.changeType === 'positive' ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              <span>{Math.abs(card.change)}% from last month</span>
            </div>
            {card.sparklineData && (
              <div className={styles.sparkline}>
                {renderSparkline(card.sparklineData)}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <ChartCard title="Income vs Expense Trend" className={styles.chartFullWidth}>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={incomeData.map((item, idx) => ({
                ...item,
                expenses: expenseData[idx]?.value || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--text-tertiary)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--text-tertiary)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value / 1000}k`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: 'var(--space-3)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                  cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }}
                />
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                  name="Income"
                  animationDuration={1000}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                  name="Expenses"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Expense by Category">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {expenseByCategory.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: 'var(--space-3)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;