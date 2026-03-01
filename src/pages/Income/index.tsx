import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import Button from '../../components/common/Button';
import FilterBar from '../../components/common/FilterBar';
import Table from '../../components/common/Table';
import { incomeService } from '../../services/api';
import { authService } from '../../services/api';
import styles from './Income.module.css';

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

const Income: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMounted = React.useRef(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const currentUser = authService.getCurrentUser();

  const fetchIncomes = async (retryCount = 0): Promise<boolean> => {
    if (!isMounted.current) return false;

    try {
      setLoading(true);
      const response = await incomeService.getAll();
      if (isMounted.current) {
        setIncomes(response.data.data);
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
        return fetchIncomes(retryCount + 1);
      }
      
      if (status !== 401) {
        setError(err.response?.data?.message || 'Failed to fetch income data');
        console.error('Error fetching incomes:', err);
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
      fetchIncomes();
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
      fetchIncomes().finally(() => {
        if (isMounted.current) {
          setShouldRefresh(false);
          window.history.replaceState({}, document.title);
        }
      });
    }
  }, [shouldRefresh]);

  // Retry handler for error button
  const handleRetry = () => {
    fetchIncomes();
  };

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
    
    incomes.forEach(income => {
      const date = new Date(income.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthYear, (monthlyMap.get(monthYear) || 0) + income.amount);
    });

    return Array.from(monthlyMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const processCategoryData = (): CategoryData[] => {
    const categoryMap = new Map<string, number>();
    let total = 0;
    
    incomes.forEach(income => {
      categoryMap.set(income.category, (categoryMap.get(income.category) || 0) + income.amount);
      total += income.amount;
    });

    const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

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
    const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    
    incomes.forEach(income => {
      const memberName = income.member?.name || 'Unknown';
      memberMap.set(memberName, (memberMap.get(memberName) || 0) + income.amount);
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

  const monthlyIncomeData = processMonthlyData();
  const incomeByCategory = processCategoryData();
  const incomeByMember = processMemberData();

  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const highestCategory = incomeByCategory[0] || { category: 'N/A', amount: 0 };
  const topContributor = incomeByMember[0] || { memberName: 'N/A', amount: 0 };

  const columns = [
    { key: 'date', header: 'Date', sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'description', header: 'Description', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'member', header: 'Member', sortable: true, render: (value: any) => value?.name || 'N/A' },
    { key: 'amount', header: 'Amount', sortable: true, render: (value: number) => <span className={styles.amountPositive}>+{formatCurrency(value)}</span> },
  ];

  if (loading) {
    return (
      <div className={styles.incomePage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Income</h1>
          <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/income/add')}>
            Add Income
          </Button>
        </div>
        <Card>
          <div className={styles.loadingContainer}>
            <p>Loading income data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.incomePage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Income</h1>
          <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/income/add')}>
            Add Income
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
    <div className={styles.incomePage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Income</h1>
        <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/income/add')}>
          Add Income
        </Button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card variant="success">
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryCardTitle}>Total Income</h3>
            <p className={styles.summaryCardValue}>{formatCurrency(totalIncome)}</p>
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
            <h3 className={styles.summaryCardTitle}>Top Contributor</h3>
            <p className={styles.summaryCardValue}>{topContributor.memberName}</p>
            <p className={styles.summaryCardSubtext}>{formatCurrency(topContributor.amount)}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search income transactions..."
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
        <ChartCard title="Monthly Income Trend">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyIncomeData}>
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
                  formatter={(value: number) => [formatCurrency(value), 'Income']}
                  cursor={{ stroke: 'var(--border-color)', strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Income by Category">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={incomeByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {incomeByCategory.map((entry, index) => (
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

        <ChartCard title="Income by Member">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={incomeByMember}>
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
                  {incomeByMember.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Data Table */}
      <Card title="Income Transactions" subtitle={`${incomes.length} transactions`}>
        <Table
          data={incomes}
          columns={columns}
        />
      </Card>
    </div>
  );
};

export default Income;