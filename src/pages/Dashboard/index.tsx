import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, LineChart as LineChartIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import Button from '../../components/common/Button';
import { analyticsService } from '../../services/api';
import styles from './Dashboard.module.css';

// Constants (outside component to avoid recreation)
const CACHE_KEY = 'dashboardCache';
const TIME_KEY = 'dashboardCacheTime';
const FETCH_INTERVAL = 30000; // 30 seconds

interface SummaryCard {
  title: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative';
  sparklineData?: number[];
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

const Dashboard: React.FC = () => {
  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([]);
  const [incomeData, setIncomeData] = useState<MonthlyData[]>([]);
  const [expenseData, setExpenseData] = useState<MonthlyData[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if user is authenticated via token
  const token = localStorage.getItem('token');

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (fetchInProgress.current) {
      return;
    }
    // Double-check token (in case it changed)
    const currentToken = localStorage.getItem('token');
    if (!currentToken || !isMounted.current) {
      return;
    }

    fetchInProgress.current = true;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout

    try {
      setLoading(true);
      const response = await analyticsService.getDashboardData({ signal: abortController.signal });
      const { summary, income, expenses, savings, investments } = response.data.data;

      // Process summary cards
      const generateSparkline = (data: number[]) =>
        data.length > 0 ? data : Array(6).fill(0).map(() => Math.random() * 1000);

      const cards: SummaryCard[] = [
        {
          title: 'Total Income',
          value: summary.totalIncome,
          change: 12.5,
          changeType: 'positive',
          sparklineData: generateSparkline(income.raw.slice(-6).map((i: any) => i.amount))
        },
        {
          title: 'Total Expenses',
          value: summary.totalExpenses,
          change: 8.2,
          changeType: 'negative',
          sparklineData: generateSparkline(expenses.raw.slice(-6).map((e: any) => e.amount))
        },
        {
          title: 'Total Savings',
          value: summary.totalSavings,
          change: 15.3,
          changeType: 'positive',
          sparklineData: generateSparkline(savings.raw.filter((s: any) => s.type === 'deposit').slice(-6).map((s: any) => s.amount))
        },
        {
          title: 'Total Investments',
          value: summary.totalInvestments,
          change: 5.7,
          changeType: 'positive',
          sparklineData: generateSparkline(investments.raw.slice(-6).map((inv: any) => inv.currentValue))
        },
        {
          title: 'Net Worth',
          value: summary.netWorth,
          change: 10.2,
          changeType: 'positive',
          sparklineData: generateSparkline(Array(6).fill(0).map(() => Math.random() * 5000))
        }
      ];

      const newIncomeData = income.monthly;
      const newExpenseData = expenses.monthly;
      const newExpenseByCategory = expenses.byCategory;

      setSummaryCards(cards);
      setIncomeData(newIncomeData);
      setExpenseData(newExpenseData);
      setExpenseByCategory(newExpenseByCategory);
      setError('');

      // Save to cache with fresh data
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          summaryCards: cards,
          incomeData: newIncomeData,
          expenseData: newExpenseData,
          expenseByCategory: newExpenseByCategory
        }));
        sessionStorage.setItem(TIME_KEY, Date.now().toString());
      } catch (e) {
        // Ignore cache errors
      }
    } catch (err: any) {
      if (isMounted.current && err.name !== 'AbortError') {
        const errorMessage = err.response?.data?.message || 'Failed to fetch dashboard data';
        setError(errorMessage);
      }
    } finally {
      clearTimeout(timeoutId);
      fetchInProgress.current = false;
      if (isMounted.current) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  }, []); // Empty deps: setters are stable, token read inside

  // Cleanup on unmount: abort pending request and mark unmounted
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Expose refresh function globally
  useEffect(() => {
    (window as any).refreshDashboard = fetchDashboardData;
    return () => {
      delete (window as any).refreshDashboard;
    };
  }, [fetchDashboardData]);

  // Load from cache or fetch on mount / when auth token changes
  useEffect(() => {
    if (!token) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    // Try to load from session cache first
    try {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      const cachedTime = sessionStorage.getItem(TIME_KEY);
      if (cachedData && cachedTime) {
        const time = parseInt(cachedTime, 10);
        if (Date.now() - time < FETCH_INTERVAL) {
          const parsed = JSON.parse(cachedData);
          setSummaryCards(parsed.summaryCards);
          setIncomeData(parsed.incomeData);
          setExpenseData(parsed.expenseData);
          setExpenseByCategory(parsed.expenseByCategory);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // Ignore cache errors
    }

    // No valid cache, fetch fresh data
    fetchDashboardData();
  }, [token, fetchDashboardData]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <header className={styles.dashboardHeader}>
          <h1 className={styles.dashboardTitle}>Dashboard</h1>
          <p className={styles.dashboardSubtitle}>Your financial overview at a glance</p>
        </header>
        <Card>
          <div className={styles.loadingContainer}>
            <p>Loading dashboard data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <header className={styles.dashboardHeader}>
          <h1 className={styles.dashboardTitle}>Dashboard</h1>
          <p className={styles.dashboardSubtitle}>Your financial overview at a glance</p>
        </header>
        <Card>
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <Button onClick={fetchDashboardData}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

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
                  tickFormatter={(value) => `₹${value / 1000}k`}
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
