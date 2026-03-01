import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import Button from '../../components/common/Button';
import { investments, getInvestmentDistribution, getNetWorthData } from '../../data/mockData';
import styles from './Investments.module.css';

const Investments: React.FC = () => {
  const investmentDistribution = getInvestmentDistribution();
  const netWorthData = getNetWorthData();

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amountInvested, 0);
  const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const profitLoss = currentValue - totalInvested;
  const roi = (profitLoss / totalInvested) * 100;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const assetTypeData = investments.reduce((acc, inv) => {
    const existing = acc.find(item => item.name === inv.type);
    if (existing) {
      existing.value += inv.currentValue;
    } else {
      acc.push({ name: inv.type, value: inv.currentValue, color: inv.assetAllocation === 'Tech' ? '#0ea5e9' : inv.assetAllocation === 'Government' ? '#10b981' : inv.assetAllocation === 'Commercial' ? '#f59e0b' : '#8b5cf6' });
    }
    return acc;
  }, [] as { name: string; value: number; color: string }[]);

  return (
    <div className={styles.investmentsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Investments</h1>
        <Button leftIcon={<Wallet size={16} />}>Add Investment</Button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card variant="primary">
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>Total Invested</h3>
            <p className={styles.summaryCardValue}>{formatCurrency(totalInvested)}</p>
          </div>
        </Card>
        <Card variant="success">
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>Current Value</h3>
            <p className={styles.summaryCardValue}>{formatCurrency(currentValue)}</p>
          </div>
        </Card>
        <Card variant={profitLoss >= 0 ? 'success' : 'danger'}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>Profit / Loss</h3>
            <p className={styles.summaryCardValue}>{formatCurrency(profitLoss)}</p>
            <div className={`${styles.summaryCardChange} ${profitLoss >= 0 ? 'positive' : 'negative'}`}>
              {profitLoss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{Math.abs(roi).toFixed(1)}% ROI</span>
            </div>
          </div>
        </Card>
        <Card variant="warning">
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>ROI %</h3>
            <p className={styles.summaryCardValue}>{roi.toFixed(1)}%</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <ChartCard title="Investment Distribution">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={investmentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {investmentDistribution.map((entry, index) => (
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

        <ChartCard title="Asset Type Breakdown">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={assetTypeData}>
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
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                  cursor={{ fill: 'var(--bg-hover)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {assetTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Net Worth Growth" className={styles.chartFullWidth}>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={netWorthData}>
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
                  formatter={(value: number) => [formatCurrency(value), 'Net Worth']}
                  cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 3 }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Investment List */}
      <Card title="Investment Portfolio" subtitle={`${investments.length} investments`}>
        <div className={styles.investmentsList}>
          {investments.map((investment) => {
            const invProfit = investment.currentValue - investment.amountInvested;
            const invROI = (invProfit / investment.amountInvested) * 100;
            const isPositive = invProfit >= 0;

            return (
              <div key={investment.id} className={styles.investmentCard}>
                <div className={styles.investmentHeader}>
                  <div>
                    <h4 className={styles.investmentName}>{investment.name}</h4>
                    <span className={styles.investmentType}>{investment.type}</span>
                  </div>
                  <div className={`${styles.investmentROI} ${isPositive ? styles.positive : styles.negative}`}>
                    {isPositive ? '+' : ''}{invROI.toFixed(1)}%
                  </div>
                </div>
                <div className={styles.investmentValue}>
                  {formatCurrency(investment.currentValue)}
                </div>
                <div className={styles.investmentDetails}>
                  <span>Invested: {formatCurrency(investment.amountInvested)}</span>
                  <span>P&L: <span className={isPositive ? styles.amountPositive : styles.amountNegative}>{formatCurrency(invProfit)}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default Investments;