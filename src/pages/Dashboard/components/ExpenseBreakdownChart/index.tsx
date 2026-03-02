import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import ChartCard from '../../../../components/charts/ChartCard';
import styles from './ExpenseBreakdownChart.module.css';

interface ExpenseBreakdownChartProps {
  breakdown: Array<{ category: string; amount: number }>;
  totalExpenses: number;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'
];

const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({ breakdown, totalExpenses }) => {
  // If no data, show placeholder
  if (!breakdown || breakdown.length === 0) {
    return (
      <ChartCard title="Expense Breakdown" subtitle="By category">
        <div className={styles.noData}>
          <p>No expense data available</p>
        </div>
      </ChartCard>
    );
  }

  // Prepare data with percentages
  const data = breakdown.map((item, index) => ({
    name: item.category,
    value: item.amount,
    percentage: totalExpenses > 0 ? ((item.amount / totalExpenses) * 100).toFixed(1) : 0,
    color: COLORS[index % COLORS.length]
  }));

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <ChartCard title="Expense Breakdown" subtitle="By category">
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              key="category"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                `${formatCurrency(value)} (${props.payload.percentage}%)`,
                name
              ]}
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
              }}
            />
            <Legend 
              layout="vertical" 
              align="right" 
              verticalAlign="middle"
              formatter={(value: string, _entry: any) => (
                <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default ExpenseBreakdownChart;
