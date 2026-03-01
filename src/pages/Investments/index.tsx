import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import Button from '../../components/common/Button';
import { investmentService } from '../../services/api';
import { authService } from '../../services/api';
import styles from './Investments.module.css';

interface Investment {
  _id: string;
  assetName: string;
  assetType: string;
  investedAmount: number;
  currentValue: number;
  purchaseDate: string;
  member: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  profitLoss?: number;
  roi?: number;
}

interface DistributionData {
  name: string;
  value: number;
  color: string;
}

interface NetWorthData {
  date: string;
  value: number;
}

const Investments: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMounted = React.useRef(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const currentUser = authService.getCurrentUser();

  const fetchInvestments = async (retryCount = 0): Promise<boolean> => {
    if (!isMounted.current) return false;

    try {
      setLoading(true);
      const response = await investmentService.getAll();
      if (isMounted.current) {
        setInvestments(response.data.data);
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
        return fetchInvestments(retryCount + 1);
      }
      
      if (status !== 401) {
        setError(err.response?.data?.message || 'Failed to fetch investment data');
        console.error('Error fetching investments:', err);
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
      fetchInvestments();
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
      fetchInvestments().finally(() => {
        if (isMounted.current) {
          setShouldRefresh(false);
          window.history.replaceState({}, document.title);
        }
      });
    }
  }, [shouldRefresh]);

  // Retry handler for error button
  const handleRetry = () => {
    fetchInvestments();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate totals
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const profitLoss = currentValue - totalInvested;
  const roi = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  // Process investment distribution by asset type
  const processInvestmentDistribution = (): DistributionData[] => {
    const typeMap = new Map<string, number>();
    const typeColors: Record<string, string> = {
      'Stocks': '#0ea5e9',
      'Bonds': '#10b981',
      'Mutual Funds': '#f59e0b',
      'Cryptocurrency': '#8b5cf6',
      'Real Estate': '#ef4444',
      'Gold': '#fbbf24',
      'Fixed Deposit': '#6b7280',
      'PPF': '#ec4899',
      'SIP': '#14b8a6',
      'Other': '#9ca3af'
    };

    investments.forEach(inv => {
      const currentVal = inv.currentValue;
      typeMap.set(inv.assetType, (typeMap.get(inv.assetType) || 0) + currentVal);
    });

    return Array.from(typeMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: typeColors[name] || '#9ca3af'
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Process asset type breakdown
  const processAssetTypeData = (): DistributionData[] => {
    const typeMap = new Map<string, number>();
    
    investments.forEach(inv => {
      const currentVal = inv.currentValue;
      typeMap.set(inv.assetType, (typeMap.get(inv.assetType) || 0) + currentVal);
    });

    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6', '#fbbf24', '#9ca3af'];

    return Array.from(typeMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Process net worth growth over time
  const processNetWorthData = (): NetWorthData[] => {
    // Group investments by month/year
    const monthlyMap = new Map<string, { invested: number; current: number }>();
    
    investments.forEach(inv => {
      const date = new Date(inv.purchaseDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthYear)) {
        monthlyMap.set(monthYear, { invested: 0, current: 0 });
      }
      
      const data = monthlyMap.get(monthYear)!;
      data.invested += inv.investedAmount;
      data.current += inv.currentValue;
    });

    // For simplicity, we'll show current value trend
    // In a real app, you'd want to track value changes over time
    return Array.from(monthlyMap.entries())
      .map(([date, data]) => ({ date, value: data.current }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const investmentDistribution = processInvestmentDistribution();
  const assetTypeData = processAssetTypeData();
  const netWorthData = processNetWorthData();

  if (loading) {
    return (
      <div className={styles.investmentsPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Investments</h1>
          <Button leftIcon={<Wallet size={16} />} onClick={() => navigate('/investments/add')}>
            Add Investment
          </Button>
        </div>
        <Card>
          <div className={styles.loadingContainer}>
            <p>Loading investment data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.investmentsPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Investments</h1>
          <Button leftIcon={<Wallet size={16} />} onClick={() => navigate('/investments/add')}>
            Add Investment
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
    <div className={styles.investmentsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Investments</h1>
        <Button leftIcon={<Wallet size={16} />} onClick={() => navigate('/investments/add')}>
          Add Investment
        </Button>
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
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} width={40} />
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
                <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} width={40} />
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
            const invProfit = investment.currentValue - investment.investedAmount;
            const invROI = investment.investedAmount > 0 ? (invProfit / investment.investedAmount) * 100 : 0;
            const isPositive = invProfit >= 0;

            return (
              <div key={investment._id} className={styles.investmentCard}>
                <div className={styles.investmentHeader}>
                  <div>
                    <h4 className={styles.investmentName}>{investment.assetName}</h4>
                    <span className={styles.investmentType}>{investment.assetType}</span>
                  </div>
                  <div className={`${styles.investmentROI} ${isPositive ? styles.positive : styles.negative}`}>
                    {isPositive ? '+' : ''}{invROI.toFixed(1)}%
                  </div>
                </div>
                <div className={styles.investmentValue}>
                  {formatCurrency(investment.currentValue)}
                </div>
                <div className={styles.investmentDetails}>
                  <span>Invested: {formatCurrency(investment.investedAmount)}</span>
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