import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from '../../../../components/charts/ChartCard';
import styles from './TrendChart.module.css';

interface TrendDataPoint {
  date: string;
  income: number;
  expenses: number;
}

interface TrendChartProps {
  trendData: TrendDataPoint[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const TrendChart: React.FC<TrendChartProps> = ({ trendData }) => {
  // If no data, show placeholder
  if (!trendData || trendData.length === 0) {
    return (
      <ChartCard title="Income & Expense Trend" subtitle="Daily trend">
        <div className={styles.noData}>
          <p>No trend data available</p>
        </div>
      </ChartCard>
    );
  }

  const chartData = trendData.map(item => ({
    ...item,
    formattedDate: formatDate(item.date)
  }));

  return (
    <ChartCard title="Income & Expense Trend" subtitle="Daily trend">
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border-color)' }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--border-color)' }}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="var(--color-success)" 
              strokeWidth={2}
              dot={{ fill: 'var(--color-success)', r: 3 }}
              activeDot={{ r: 5 }}
              name="Income"
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="var(--color-error)" 
              strokeWidth={2}
              dot={{ fill: 'var(--color-error)', r: 3 }}
              activeDot={{ r: 5 }}
              name="Expenses"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default TrendChart;
