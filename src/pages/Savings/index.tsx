import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import Button from '../../components/common/Button';
import { savingsService } from '../../services/api';
import { authService } from '../../services/api';
import styles from './Savings.module.css';

interface SavingTransaction {
  _id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  note?: string;
  member: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface GrowthData {
  date: string;
  balance: number;
}

interface DepositWithdrawData {
  name: string;
  value: number;
  color: string;
}

interface MemberContribution {
  memberName: string;
  amount: number;
  percentage: number;
  color: string;
}

const Savings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [savings, setSavings] = useState<SavingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMounted = React.useRef(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const currentUser = authService.getCurrentUser();

  const fetchSavings = async (retryCount = 0): Promise<boolean> => {
    if (!isMounted.current) return false;

    try {
      setLoading(true);
      const response = await savingsService.getAll();
      if (isMounted.current) {
        setSavings(response.data.data);
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
        return fetchSavings(retryCount + 1);
      }
      
      if (status !== 401) {
        setError(err.response?.data?.message || 'Failed to fetch savings data');
        console.error('Error fetching savings:', err);
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
      fetchSavings();
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
      fetchSavings().finally(() => {
        if (isMounted.current) {
          setShouldRefresh(false);
          window.history.replaceState({}, document.title);
        }
      });
    }
  }, [shouldRefresh]);

  // Retry handler for error button
  const handleRetry = () => {
    fetchSavings();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total balance (deposits - withdrawals)
  const totalBalance = savings.reduce((sum, s) => {
    return s.type === 'deposit' ? sum + s.amount : sum - s.amount;
  }, 0);

  const totalDeposits = savings
    .filter(s => s.type === 'deposit')
    .reduce((sum, s) => sum + s.amount, 0);

  const totalWithdrawals = savings
    .filter(s => s.type === 'withdraw')
    .reduce((sum, s) => sum + s.amount, 0);

  // Process savings growth data (cumulative balance over time)
  const processSavingsGrowth = (): GrowthData[] => {
    const sortedSavings = [...savings].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const growthMap = new Map<string, number>();
    let runningBalance = 0;

    sortedSavings.forEach(saving => {
      const date = new Date(saving.date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      if (saving.type === 'deposit') {
        runningBalance += saving.amount;
      } else {
        runningBalance -= saving.amount;
      }
      
      growthMap.set(dateKey, runningBalance);
    });

    // If no savings, return empty array
    if (growthMap.size === 0) {
      return [];
    }

    // Fill in missing dates with previous balance
    const dates = Array.from(growthMap.keys()).sort();
    const filledData: GrowthData[] = [];
    let lastBalance = 0;

    dates.forEach(date => {
      const balance = growthMap.get(date) || lastBalance;
      filledData.push({ date, balance: balance });
      lastBalance = balance;
    });

    return filledData;
  };

  // Process deposit vs withdrawal data
  const processDepositVsWithdraw = (): DepositWithdrawData[] => {
    const deposits = totalDeposits;
    const withdrawals = totalWithdrawals;

    return [
      { name: 'Deposits', value: deposits, color: '#10b981' },
      { name: 'Withdrawals', value: withdrawals, color: '#ef4444' }
    ];
  };

  // Process member contributions
  const processMemberContributions = (): MemberContribution[] => {
    const memberMap = new Map<string, number>();
    let total = 0;

    savings.forEach(saving => {
      if (saving.type === 'deposit') {
        const memberName = saving.member?.name || 'Unknown';
        memberMap.set(memberName, (memberMap.get(memberName) || 0) + saving.amount);
        total += saving.amount;
      }
    });

    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return Array.from(memberMap.entries())
      .map(([memberName, amount], index) => ({
        memberName,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const savingsGrowth = processSavingsGrowth();
  const depositVsWithdraw = processDepositVsWithdraw();
  const memberContributions = processMemberContributions();

  if (loading) {
    return (
      <div className={styles.savingsPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Savings</h1>
          <Button leftIcon={<PiggyBank size={16} />} onClick={() => navigate('/savings/add')}>
            Add Deposit
          </Button>
        </div>
        <Card>
          <div className={styles.loadingContainer}>
            <p>Loading savings data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.savingsPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Savings</h1>
          <Button leftIcon={<PiggyBank size={16} />} onClick={() => navigate('/savings/add')}>
            Add Deposit
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

  const accountColors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className={styles.savingsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Savings</h1>
        <Button leftIcon={<PiggyBank size={16} />} onClick={() => navigate('/savings/add')}>
          Add Deposit
        </Button>
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
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} width={40} />
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
      <Card title="Savings Transactions" subtitle={`${savings.length} transactions`}>
        <div className={styles.transactionsGrid}>
          {savings.map((saving, index) => (
            <div key={saving._id} className={styles.transactionCard}>
              <div className={styles.transactionHeader}>
                <div className={styles.transactionIcon} style={{ backgroundColor: accountColors[index % accountColors.length] }}>
                  <PiggyBank size={20} />
                </div>
                <div>
                  <h4 className={styles.transactionName}>
                    {saving.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  </h4>
                  <p className={styles.transactionDate}>
                    {new Date(saving.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={styles.transactionAmount}>
                {saving.type === 'deposit' ? '+' : '-'}
                {formatCurrency(saving.amount)}
              </div>
              {saving.note && (
                <p className={styles.transactionNote}>{saving.note}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Savings;