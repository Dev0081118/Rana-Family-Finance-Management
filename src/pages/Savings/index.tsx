import React from 'react';
import { PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import Button from '../../components/common/Button';
import { savingsAccounts, getSavingsGrowthData, getDepositVsWithdrawData, getIncomeByMember } from '../../data/mockData';
import styles from './Savings.module.css';

const Savings: React.FC = () => {
  const savingsGrowth = getSavingsGrowthData();
  const depositVsWithdraw = getDepositVsWithdrawData();
  const memberContributions = getIncomeByMember();

  const totalBalance = savingsAccounts.reduce((sum, account) => sum + account.balance, 0);
  const totalDeposits = depositVsWithdraw[0]?.value || 0;
  const totalWithdrawals = depositVsWithdraw[1]?.value || 0;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const accountColors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className={styles.savingsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Savings</h1>
        <Button leftIcon={<PiggyBank size={16} />}>Add Deposit</Button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card variant="primary" className={styles.balanceCard}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>Total Balance</h3>
            <p className={styles.summaryCardValue}>{formatCurrency(totalBalance)}</p>
          </div>
        </Card>
        <Card variant="success">
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>Total Deposits</h3>
            <p className={styles.summaryCardValue}>{formatCurrency(totalDeposits)}</p>
            <div className={`${styles.summaryCardChange} positive`}>
              <ArrowUpRight size={16} />
              <span>+12.5%</span>
            </div>
          </div>
        </Card>
        <Card variant="danger">
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>Total Withdrawals</h3>
            <p className={styles.summaryCardValue}>{formatCurrency(totalWithdrawals)}</p>
            <div className={`${styles.summaryCardChange} negative`}>
              <ArrowDownRight size={16} />
              <span>-5.2%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <ChartCard title="Savings Growth Over Time" className={styles.chartFullWidth}>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={savingsGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: 'var(--space-3)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Balance']}
                  cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 3 }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Deposit vs Withdrawal">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={depositVsWithdraw}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: 'var(--space-3)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                  cursor={{ fill: 'var(--bg-hover)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {depositVsWithdraw.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Member Contributions">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={memberContributions}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ memberName, percentage }) => `${memberName} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {memberContributions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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

      {/* Savings Accounts */}
      <Card title="Savings Accounts" subtitle={`${savingsAccounts.length} accounts`}>
        <div className={styles.accountsGrid}>
          {savingsAccounts.map((account, index) => (
            <div key={account.id} className={styles.accountCard}>
              <div className={styles.accountHeader}>
                <div className={styles.accountIcon} style={{ backgroundColor: accountColors[index % accountColors.length] }}>
                  <PiggyBank size={20} />
                </div>
                <div>
                  <h4 className={styles.accountName}>{account.name}</h4>
                  <p className={styles.accountType}>{account.type}</p>
                </div>
              </div>
              <div className={styles.accountBalance}>
                {formatCurrency(account.balance)}
              </div>
              <div className={styles.accountInterest}>
                {account.interestRate}% APY
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Savings;