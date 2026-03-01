import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import Button from '../../components/common/Button';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { analyticsService } from '../../services/api';
import { authService } from '../../services/api';
import {
  getLastFetchTime,
  setLastFetchTime,
  getCachedData,
  setCachedData,
  clearCache,
  shouldFetch,
  FETCH_CONFIG,
  CACHE_KEYS,
} from '../../utils/fetchUtils';
import styles from './Analytics.module.css';

interface IncomeTransaction {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  member: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface ExpenseTransaction {
  _id: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  member: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface SavingTransaction {
  _id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  note?: string;
  member: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface Investment {
  _id: string;
  assetName: string;
  assetType: string;
  investedAmount: number;
  currentValue: number;
  purchaseDate: string;
  member: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface NetWorthData {
  date: string;
  value: number;
}

interface YearlyData {
  date: string;
  income: number;
  expenses: number;
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
  percentage: number;
  color: string;
  memberId: string;
}

const Analytics: React.FC = () => {
  const [incomes, setIncomes] = useState<IncomeTransaction[]>([]);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>([]);
  const [savings, setSavings] = useState<SavingTransaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUser = useMemo(() => authService.getCurrentUser(), []);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load from sessionStorage cache on mount
  useEffect(() => {
    try {
      const cachedData = getCachedData<{
        incomes: IncomeTransaction[];
        expenses: ExpenseTransaction[];
        savings: SavingTransaction[];
        investments: Investment[];
      }>(CACHE_KEYS.ANALYTICS);
      if (cachedData) {
        setIncomes(cachedData.incomes);
        setExpenses(cachedData.expenses);
        setSavings(cachedData.savings);
        setInvestments(cachedData.investments);
        setLoading(false);
        console.log('Analytics: Loaded from session cache');
      }
    } catch (e) {
      console.error('Error loading from cache:', e);
    }
  }, []);

  // Memoized fetch function with proper dependencies
  const fetchAllData = useCallback(async (signal?: AbortSignal) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Prevent concurrent requests
    if (fetchInProgress.current) {
      return;
    }
    
    const now = Date.now();
    const lastFetch = getLastFetchTime();
    
    // Check if we should skip due to throttling (only if we already have data)
    if (!shouldFetch(lastFetch, FETCH_CONFIG.MIN_INTERVAL, incomes.length > 0)) {
      return;
    }
    
    // Check if component is still mounted and user exists
    if (!currentUser || !isMounted.current) {
      return;
    }

    fetchInProgress.current = true;
    setLastFetchTime(now);

    try {
      setLoading(true);
      const response = await analyticsService.getDashboardData({
        signal: signal || abortControllerRef.current.signal,
      });
      const { income, expenses, savings, investments } = response.data.data;

      // Use fresh data from response
      const freshIncomes = income.raw;
      const freshExpenses = expenses.raw;
      const freshSavings = savings.raw;
      const freshInvestments = investments.raw;

      setIncomes(freshIncomes);
      setExpenses(freshExpenses);
      setSavings(freshSavings);
      setInvestments(freshInvestments);
      setError('');
      console.log('Analytics: Data fetched successfully');
      // Save to cache with fresh data
      setCachedData(CACHE_KEYS.ANALYTICS, {
        incomes: freshIncomes,
        expenses: freshExpenses,
        savings: freshSavings,
        investments: freshInvestments,
      });
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        return;
      }
      // Only set error if component is still mounted
      if (isMounted.current) {
        setError(err.response?.data?.message || 'Failed to fetch analytics data');
        console.error('Error fetching analytics data:', err);
      }
    } finally {
      fetchInProgress.current = false;
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [currentUser, incomes.length]);

  // Initial fetch on mount
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser, fetchAllData]);

  // Expose fetch function globally for manual refresh
  useEffect(() => {
    (window as any).refreshAnalytics = fetchAllData;
    return () => {
      delete (window as any).refreshAnalytics;
    };
  }, [fetchAllData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Process net worth data (assets - liabilities over time)
  const processNetWorthData = (): NetWorthData[] => {
    // Combine investment current values and savings balance over time
    // For simplicity, we'll create monthly data points
    const monthlyMap = new Map<string, { assets: number; savings: number }>();

    // Add investments
    investments.forEach(inv => {
      const date = new Date(inv.purchaseDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(monthYear)) {
        monthlyMap.set(monthYear, { assets: 0, savings: 0 });
      }
      monthlyMap.get(monthYear)!.assets += inv.currentValue;
    });

    // Add savings (deposits only for asset calculation)
    savings.forEach(saving => {
      if (saving.type === 'deposit') {
        const date = new Date(saving.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap.has(monthYear)) {
          monthlyMap.set(monthYear, { assets: 0, savings: 0 });
        }
        monthlyMap.get(monthYear)!.savings += saving.amount;
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([date, data]) => ({ date, value: data.assets + data.savings }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Process yearly income vs expense comparison
  const processYearlyIncomeExpense = (): YearlyData[] => {
    const yearlyMap = new Map<string, { income: number; expenses: number }>();

    incomes.forEach(income => {
      const date = new Date(income.date);
      const year = date.getFullYear().toString();
      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, { income: 0, expenses: 0 });
      }
      yearlyMap.get(year)!.income += income.amount;
    });

    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const year = date.getFullYear().toString();
      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, { income: 0, expenses: 0 });
      }
      yearlyMap.get(year)!.expenses += expense.amount;
    });

    return Array.from(yearlyMap.entries())
      .map(([date, data]) => ({ date, income: data.income, expenses: data.expenses }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Process savings growth (cumulative deposits over time)
  const processSavingsGrowth = (): NetWorthData[] => {
    const sortedSavings = [...savings]
      .filter(s => s.type === 'deposit')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const monthlyMap = new Map<string, number>();
    let runningTotal = 0;

    sortedSavings.forEach(saving => {
      const date = new Date(saving.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      runningTotal += saving.amount;
      monthlyMap.set(monthYear, runningTotal);
    });

    return Array.from(monthlyMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Process income by member
  const processIncomeByMember = (): MemberData[] => {
    const memberMap = new Map<string, { amount: number; name: string }>();
    let total = 0;

    incomes.forEach(income => {
      const memberId = income.member?._id || 'unknown';
      const memberName = income.member?.name || 'Unknown';
      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, { amount: 0, name: memberName });
      }
      memberMap.get(memberId)!.amount += income.amount;
      total += income.amount;
    });

    const colors = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return Array.from(memberMap.entries())
      .map(([memberId, data], index) => ({
        memberId,
        memberName: data.name,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Process expense by member
  const processExpenseByMember = (): MemberData[] => {
    const memberMap = new Map<string, { amount: number; name: string }>();
    let total = 0;

    expenses.forEach(expense => {
      const memberId = expense.member?._id || 'unknown';
      const memberName = expense.member?.name || 'Unknown';
      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, { amount: 0, name: memberName });
      }
      memberMap.get(memberId)!.amount += expense.amount;
      total += expense.amount;
    });

    const colors = ['#ef4444', '#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#ec4899'];

    return Array.from(memberMap.entries())
      .map(([memberId, data], index) => ({
        memberId,
        memberName: data.name,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Process top expense categories
  const processTopExpenseCategories = (): CategoryData[] => {
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
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories
  };

  // Process expense by category (for pie chart)
  const processExpenseByCategory = (): CategoryData[] => {
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

  const netWorthData = processNetWorthData();
  const yearlyIncomeExpense = processYearlyIncomeExpense();
  const savingsGrowth = processSavingsGrowth();
  const incomeByMember = processIncomeByMember();
  const expenseByMember = processExpenseByMember();
  const topExpenseCategories = processTopExpenseCategories();
  const expenseByCategory = processExpenseByCategory();

  if (loading) {
    return (
      <div className={styles.analyticsPage}>
        <h1 className={styles.sectionTitle}>Analytics</h1>
        <Card>
          <div className={styles.loadingContainer}>
            <p>Loading analytics data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.analyticsPage}>
        <h1 className={styles.sectionTitle}>Analytics</h1>
        <Card>
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <Button onClick={() => fetchAllData()}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.analyticsPage}>
      <h1 className={styles.sectionTitle}>Analytics</h1>

      {/* Section 1: Financial Health */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Financial Health</h2>
        <div className={styles.chartsGrid}>
          <ChartCard title="Net Worth Growth" className={styles.chartFullWidth}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={netWorthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Net Worth']}
                />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ fill: '#0ea5e9' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Yearly Income vs Expense">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyIncomeExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Savings Growth">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={savingsGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Savings']}
                />
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="url(#savingsGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      {/* Section 2: Member Analysis */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Member Analysis</h2>
        <div className={styles.chartsGrid}>
          <ChartCard title="Income Contribution by Member">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incomeByMember}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ memberName, percentage }) => `${memberName} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {incomeByMember.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Expense Distribution by Member">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseByMember}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="memberName" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {expenseByMember.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className={styles.memberGrid}>
          {incomeByMember.map((member) => (
            <div key={member.memberId} className={styles.memberCard}>
              <div className={styles.memberAvatar} style={{ backgroundColor: member.color }}>
                {member.memberName.charAt(0)}
              </div>
              <h4 className={styles.memberName}>{member.memberName}</h4>
              <p className={styles.memberValue}>{formatCurrency(member.amount)}</p>
              <p className={styles.memberPercentage}>{member.percentage}% of total income</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Category Analysis */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Category Analysis</h2>
        <div className={styles.chartsGrid}>
          <ChartCard title="Top Expense Categories">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topExpenseCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-tertiary)" fontSize={12} tickFormatter={(value) => `₹${value / 1000}k`} />
                <YAxis dataKey="category" type="category" stroke="var(--text-tertiary)" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
                  {topExpenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Expense Categories Breakdown">
            <ResponsiveContainer width="100%" height={300}>
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
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>
    </div>
  );
};

export default Analytics;