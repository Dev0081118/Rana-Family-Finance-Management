import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart, Area } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import Button from '../../components/common/Button';
import FilterBar from '../../components/common/FilterBar';
import Table from '../../components/common/Table';
import { expenseService, incomeService } from '../../services/api';
import { authService } from '../../services/api';
import styles from './Expenses.module.css';

interface ExpenseTransaction {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  member: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface IncomeTransaction {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  member: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MonthlyData {
  date: string;
  value: number;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface MemberData {
  memberName: string;
  amount: number;
  color: string;
}

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMounted = React.useRef(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const currentUser = authService.getCurrentUser();

  const fetchExpenses = async (retryCount = 0): Promise<boolean> => {
    if (!isMounted.current) return false;

    try {
      setLoading(true);
      const response = await expenseService.getAll();
      if (isMounted.current) {
        setExpenses(response.data.data);
        setError('');
      }
      return true;
    } catch (err: any) {
      if (!isMounted.current) return false;

      const status = err.response?.status;
      
      // Handle 429 Too Many Requests with exponential backoff
      if (status === 429) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchExpenses(retryCount + 1);
      }
      
      if (status !== 401) {
        setError(err.response?.data?.message || 'Failed to fetch expense data');
        console.error('Error fetching expenses:', err);
      }
      return false;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    if (currentUser) {
      fetchExpenses();
    }
    return () => {
      isMounted.current = false;
    };
  }, [currentUser?.id]); // Only depend on user ID, not whole object

  // Refresh data when returning from add page - use state flag instead of location.state
  useEffect(() => {
    if (location.state?.refresh) {
      setShouldRefresh(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (shouldRefresh && isMounted.current) {
      fetchExpenses().finally(() => {
        if (isMounted.current) {
          setShouldRefresh(false);
          window.history.replaceState({}, document.title);
        }
      });
    }
  }, [shouldRefresh]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Process data for charts
  const processMonthlyData = (): MonthlyData[] => {
    const monthlyMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthYear, (monthlyMap.get(monthYear) || 0) + expense.amount);
    });

    return Array.from(monthlyMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const processCategoryData = (): CategoryData[] => {
    const categoryMap = new Map<string, number>();
    let total = 0;
    
    expenses.forEach(expense => {
      categoryMap.set(expense.category, (categoryMap.get(expense.category) || 0) + expense.amount);
      total += expense.amount;
    });

    const colors = ['#ef4444', '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#ec4899', '#6b7280'];

    return Array.from(categoryMap.entries())
      .map(([category, amount], index) => ({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const processMemberData = (): MemberData[] => {
    const memberMap = new Map<string, number>();
    const memberColors = new Map<string, string>();
    const colors = ['#ef4444', '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#ec4899'];
    
    expenses.forEach(expense => {
      const memberName = expense.member?.name || 'Unknown';
      memberMap.set(memberName, (memberMap.get(memberName) || 0) + expense.amount);
      if (!memberColors.has(memberName)) {
        memberColors.set(memberName, colors[memberColors.size % colors.length]);
      }
    });

    return Array.from(memberMap.entries())
      .map(([memberName, amount]) => ({
        memberName,
        amount,
        color: memberColors.get(memberName) || '#6b7280'
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const monthlyExpenseData = processMonthlyData();
  const expenseByCategory = processCategoryData();
  const expenseByMember = processMemberData();

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const highestCategory = expenseByCategory[0] || { category: 'N/A', amount: 0 };
  const topSpender = expenseByMember[0] || { memberName: 'N/A', amount: 0 };

  const columns = [
    { key: 'date', header: 'Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'description', header: 'Description', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'member', header: 'Member', sortable: true, render: (value: any) => value?.name || 'N/A' },
    { key: 'amount', header: 'Amount', sortable: true, render: (value: number) => <span className={styles.amountNegative}>-{formatCurrency(value)}</span> },
  ];

  // For income vs expense comparison, we need to fetch income data too
  const [monthlyIncomeData, setMonthlyIncomeData] = useState<MonthlyData[]>([]);

  const fetchIncomeData = async (retryCount = 0): Promise<boolean> => {
    if (!isMounted.current) return false;

    try {
      const response = await incomeService.getAll();
      const incomeTransactions = response.data.data as IncomeTransaction[];
      
      // Process income data into monthly format
      const monthlyMap = new Map<string, number>();
      incomeTransactions.forEach(income => {
        const date = new Date(income.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(monthYear, (monthlyMap.get(monthYear) || 0) + income.amount);
      });

      const processedData = Array.from(monthlyMap.entries())
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (isMounted.current) {
        setMonthlyIncomeData(processedData);
      }
      return true;
    } catch (err: any) {
      if (!isMounted.current) return false;

      const status = err.response?.status;
      
      if (status === 429) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.warn(`Rate limited (income). Retrying in ${delay}ms (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchIncomeData(retryCount + 1);
      }
      
      console.error('Error fetching income data for comparison:', err);
      return false;
    }
  };

  useEffect(() => {
    if (!loading && isMounted.current) {
      fetchIncomeData();
    }
  }, [loading]);

  // Retry handler for error button
  const handleRetry = () => {
    fetchExpenses();
  };

  const comparisonData = monthlyIncomeData.map((income, index) => ({
    date: income.date,
    income: income.value,
    expenses: monthlyExpenseData[index]?.value || 0,
  }));

  if (loading) {
    return (
      <div className={styles.expensesPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Expenses</h1>
          <Button leftIcon={<Plus size={16} />} variant="danger" onClick={() => navigate('/expenses/add')}>
            Add Expense
          </Button>
        </div>
        <Card>
          <div className={styles.loadingContainer}>
            <p>Loading expense data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.expensesPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Expenses</h1>
          <Button leftIcon={<Plus size={16} />} variant="danger" onClick={() => navigate('/expenses/add')}>
            Add Expense
          </Button>
        </div>
        <Card>
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <Button onClick={handleRetry}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.expensesPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Expenses</h1>
        <Button leftIcon={<Plus size={16} />} variant="danger" onClick={() => navigate('/expenses/add')}>
          Add Expense
        </Button>
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
              <option value="">All Members</option>
              {/* Member filter would require an API endpoint to fetch all family members */}
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
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} width={40} />
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
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} width={40} />
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
                <YAxis stroke="var(--text-tertiary}" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} width={40} />
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
      <Card title="Expense Transactions" subtitle={`${expenses.length} transactions`}>
        <Table
          data={expenses}
          columns={columns}
        />
      </Card>
    </div>
  );
};

export default Expenses;