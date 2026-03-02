import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from '../../../../components/charts/ChartCard';
import styles from './IncomeExpenseChart.module.css';

interface IncomeExpenseChartProps {
  income: number;
  expenses: number;
}

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ income, expenses }) => {
  const data = [
    {
      name: 'Comparison',
      Income: income,
      Expenses: expenses
    }
  ];

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <ChartCard title="Income vs Expenses" subtitle="Total comparison">
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border-color)' }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border-color)' }}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), '']}
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="Income" 
              fill="var(--color-success)" 
              radius={[8, 8, 0, 0]}
              name="Income"
            />
            <Bar 
              dataKey="Expenses" 
              fill="var(--color-error)" 
              radius={[8, 8, 0, 0]}
              name="Expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default IncomeExpenseChart;
