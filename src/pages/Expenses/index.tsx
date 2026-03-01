import React from 'react';
import { Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart, Area } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import Button from '../../components/common/Button';
import FilterBar from '../../components/common/FilterBar';
import Table from '../../components/common/Table';
import { transactions, getMonthlyExpenseData, getExpenseByCategory, getExpenseByMember, getMonthlyIncomeData } from '../../data/mockData';
import styles from './Expenses.module.css';

const Expenses: React.FC = () => {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const monthlyExpenseData = getMonthlyExpenseData();
  const expenseByCategory = getExpenseByCategory();
  const expenseByMember = getExpenseByMember();
  const monthlyIncomeData = getMonthlyIncomeData();

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const highestCategory = expenseByCategory[0];
  const topSpender = expenseByMember[0];

  const columns = [
    { key: 'date', header: 'Date', sortable: true },
    { key: 'description', header: 'Description', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'memberName', header: 'Member', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true, render: (value: number) => <span className={styles.amountNegative}>-{formatCurrency(value)}</span> },
  ];

  const comparisonData = monthlyIncomeData.map((income, index) => ({
    date: income.date,
    income: income.value,
    expenses: monthlyExpenseData[index]?.value || 0,
  }));

  return (
    <div className={styles.expensesPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Expenses</h1>
        <Button leftIcon={<Plus size={16} />} variant="danger">Add Expense</Button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card variant="danger">
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>Total Expenses</h3>
            <p className={styles.summaryCardValue}>{formatCurrency(totalExpenses)}</p>
          </div>
        </Card>
        <Card variant="primary">
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>Highest Category</h3>
            <p className={styles.summaryCardValue}>{highestCategory.category}</p>
            <p className={styles.summaryCardSubtext}>{formatCurrency(highestCategory.amount)}</p>
          </div>
        </Card>
        <Card variant="warning">
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>Top Spender</h3>
            <p className={styles.summaryCardValue}>{topSpender.memberName}</p>
            <p className={styles.summaryCardSubtext}>{formatCurrency(topSpender.amount)}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search expense transactions..."
        actions={
          <>
            <select className={styles.filterSelect}>
              <option>All Months</option>
              <option>January 2024</option>
              <option>December 2023</option>
            </select>
            <select className={styles.filterSelect}>
              <option>All Members</option>
              <option>John Doe</option>
              <option>Jane Smith</option>
            </select>
          </>
        }
      />

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <ChartCard title="Monthly Expense Trend">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyExpenseData}>
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
                  formatter={(value: number) => [formatCurrency(value), 'Expenses']}
                  cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} animationDuration={1000} />
              </LineChart>
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
                  {expenseByCategory.map((entry, index) => (
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

        <ChartCard title="Expense by Member">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={expenseByMember}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="memberName" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
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
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {expenseByMember.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Income vs Expense Comparison" className={styles.chartFullWidth}>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={comparisonData}>
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
                  formatter={(value: number) => [formatCurrency(value), '']}
                  cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="income" fill="#10b981" fillOpacity={0.3} stroke="#10b981" strokeWidth={2} name="Income" animationDuration={1000} />
                <Area type="monotone" dataKey="expenses" fill="#ef4444" fillOpacity={0.3} stroke="#ef4444" strokeWidth={2} name="Expenses" animationDuration={1000} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Data Table */}
      <Card title="Expense Transactions" subtitle={`${expenseTransactions.length} transactions`}>
        <Table
          data={expenseTransactions}
          columns={columns}
        />
      </Card>
    </div>
  );
};

export default Expenses;