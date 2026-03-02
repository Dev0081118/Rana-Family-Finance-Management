import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Trash2, Coins, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import Card from '../../components/common/Card';
import ChartCard from '../../components/charts/ChartCard';
import Button from '../../components/common/Button';
import FilterBar from '../../components/common/FilterBar';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { loanService } from '../../services/api';
import { authService } from '../../services/api';
import { Loan, LoanRepayment, LoanSummary } from '../../types';
import styles from './Loans.module.css';

const Loans: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMounted = React.useRef(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedRepayments, setSelectedRepayments] = useState<LoanRepayment[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const currentUser = authService.getCurrentUser();

  const fetchLoans = async (retryCount = 0): Promise<boolean> => {
    if (!isMounted.current) return false;

    try {
      setLoading(true);
      const response = await loanService.getAll();
      if (isMounted.current) {
        setLoans(response.data.data);
        setError('');
      }
      return true;
    } catch (err: any) {
      if (!isMounted.current) return false;

      const status = err.response?.status;
      
      if (status === 429) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.warn(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchLoans(retryCount + 1);
      }
      
      if (status !== 401) {
        setError(err.response?.data?.message || 'Failed to fetch loan data');
        console.error('Error fetching loans:', err);
      }
      return false;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const fetchLoanRepayments = async (loanId: string) => {
    try {
      const response = await loanService.getRepayments(loanId);
      return response.data.data;
    } catch (err: any) {
      console.error('Error fetching repayments:', err);
      return [];
    }
  };

  useEffect(() => {
    isMounted.current = true;
    if (currentUser) {
      fetchLoans();
    }
    return () => {
      isMounted.current = false;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (location.state?.refresh) {
      setShouldRefresh(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (shouldRefresh && isMounted.current) {
      fetchLoans().finally(() => {
        if (isMounted.current) {
          setShouldRefresh(false);
          window.history.replaceState({}, document.title);
        }
      });
    }
  }, [shouldRefresh]);

  const handleRetry = () => {
    fetchLoans();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Utility: Get unique statuses from loans
  const getStatusOptions = (): Array<{ value: string; label: string }> => {
    const statusesSet = new Set<string>();
    loans.forEach(loan => {
      statusesSet.add(loan.status);
    });
    
    const sortedStatuses = Array.from(statusesSet).sort();
    
    return [
      { value: 'all', label: 'All Statuses' },
      ...sortedStatuses.map(status => ({ 
        value: status, 
        label: status.charAt(0).toUpperCase() + status.slice(1) 
      }))
    ];
  };

  // Utility: Get unique members from loans
  const getMemberOptions = (): Array<{ value: string; label: string }> => {
    const membersSet = new Set<string>();
    loans.forEach(loan => {
      if (loan.memberName) {
        membersSet.add(loan.memberName);
      }
    });
    
    const sortedMembers = Array.from(membersSet).sort();
    
    return [
      { value: 'all', label: 'All Members' },
      ...sortedMembers.map(name => ({ value: name, label: name }))
    ];
  };

  // Get filtered loans based on selected filters
  const getFilteredLoans = (): Loan[] => {
    return loans.filter(loan => {
      let statusMatch = true;
      let memberMatch = true;

      if (selectedStatus !== 'all') {
        statusMatch = loan.status === selectedStatus;
      }

      if (selectedMember !== 'all') {
        memberMatch = loan.memberName === selectedMember;
      }

      return statusMatch && memberMatch;
    });
  };

  const filteredLoans = getFilteredLoans();

  // Calculate summary statistics
  const calculateSummary = (): LoanSummary => {
    const totalLoans = filteredLoans.length;
    const totalLoanAmount = filteredLoans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    const totalRemainingBalance = filteredLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
    const totalMonthlyPayments = filteredLoans.reduce((sum, loan) => sum + loan.monthlyInstallment, 0);
    const totalInterestPaid = filteredLoans.reduce((sum, loan) => sum + (loan.totalAmountToPay - loan.loanAmount), 0);
    const totalInterestRemaining = filteredLoans.reduce((sum, loan) => sum + (loan.totalInterestPayable - (loan.totalAmountToPay - loan.loanAmount)), 0);
    const overdueLoans = filteredLoans.filter(loan => loan.status === 'overdue').length;
    
    // Calculate upcoming payments (loans with next payment due in next 7 days)
    const today = new Date();
    const upcomingPayments = filteredLoans.filter(loan => {
      if (loan.status !== 'active') return false;
      // Simple check - in real app would track next payment date
      return loan.remainingBalance > 0;
    }).length;

    return {
      totalLoans,
      totalLoanAmount,
      totalRemainingBalance,
      totalMonthlyPayments,
      totalInterestPaid,
      totalInterestRemaining,
      overdueLoans,
      upcomingPayments,
    };
  };

  const summary = calculateSummary();

  // Process data for charts
  const processLoanStatusData = () => {
    const statusMap = new Map<string, number>();
    filteredLoans.forEach(loan => {
      statusMap.set(loan.status, (statusMap.get(loan.status) || 0) + 1);
    });

    const colors = {
      active: '#10b981',
      completed: '#6b7280',
      overdue: '#ef4444',
      pending: '#f59e0b',
    };

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: colors[status as keyof typeof colors] || '#6b7280',
    }));
  };

  const processLoanAmountData = () => {
    return filteredLoans.map(loan => ({
      name: loan.name,
      loanAmount: loan.loanAmount,
      remaining: loan.remainingBalance,
      paid: loan.loanAmount - loan.remainingBalance,
    }));
  };

  const processMonthlyPaymentData = () => {
    const monthlyMap = new Map<string, { principal: number; interest: number; total: number }>();
    
    filteredLoans.forEach(loan => {
      // Estimate monthly breakdown (principal + interest)
      const monthlyPrincipal = loan.loanAmount / loan.term;
      const monthlyInterest = loan.monthlyInstallment - monthlyPrincipal;
      
      const monthKey = loan.startDate.substring(0, 7); // YYYY-MM
      const existing = monthlyMap.get(monthKey) || { principal: 0, interest: 0, total: 0 };
      monthlyMap.set(monthKey, {
        principal: existing.principal + monthlyPrincipal,
        interest: existing.interest + monthlyInterest,
        total: existing.total + loan.monthlyInstallment,
      });
    });

    return Array.from(monthlyMap.entries())
      .map(([date, values]) => ({
        date,
        ...values,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const loanStatusData = processLoanStatusData();
  const loanAmountData = processLoanAmountData();
  const monthlyPaymentData = processMonthlyPaymentData();

  // CRUD Action Handlers
  const handleView = async (loan: Loan) => {
    setSelectedLoan(loan);
    const repayments = await fetchLoanRepayments(loan.id);
    setSelectedRepayments(repayments);
    setViewModalOpen(true);
  };

  const handleEdit = (loan: Loan) => {
    setSelectedLoan(loan);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (loan: Loan) => {
    setSelectedLoan(loan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLoan) return;

    try {
      setActionLoading(true);
      await loanService.delete(selectedLoan.id);
      setDeleteDialogOpen(false);
      setSelectedLoan(null);
      await fetchLoans();
    } catch (err: any) {
      console.error('Error deleting loan:', err);
      setError(err.response?.data?.message || 'Failed to delete loan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (formData: any) => {
    if (!selectedLoan) return;

    try {
      setActionLoading(true);
      await loanService.update(selectedLoan.id, formData);
      setEditModalOpen(false);
      setSelectedLoan(null);
      await fetchLoans();
    } catch (err: any) {
      console.error('Error updating loan:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRepayment = async (formData: { amount: number; paymentDate: string; paymentMethod: string; notes?: string }) => {
    if (!selectedLoan) return;

    try {
      setActionLoading(true);
      await loanService.addRepayment(selectedLoan.id, formData);
      setRepaymentModalOpen(false);
      setSelectedLoan(null);
      await fetchLoans();
    } catch (err: any) {
      console.error('Error adding repayment:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const closeModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setDeleteDialogOpen(false);
    setRepaymentModalOpen(false);
    setSelectedLoan(null);
    setSelectedRepayments([]);
  };

  // Table columns with action buttons
  const columns = [
    { key: 'name', header: 'Loan Name', sortable: true },
    { key: 'lender', header: 'Lender', sortable: true },
    { 
      key: 'loanAmount', 
      header: 'Loan Amount', 
      sortable: true, 
      render: (value: number) => <span className={styles.amountPositive}>{formatCurrency(value)}</span>
    },
    { 
      key: 'interestRate', 
      header: 'Interest Rate', 
      sortable: true, 
      render: (value: number) => <span>{formatPercentage(value)}</span>
    },
    { 
      key: 'monthlyInstallment', 
      header: 'Monthly Installment', 
      sortable: true, 
      render: (value: number) => <span className={styles.amountNeutral}>{formatCurrency(value)}</span>
    },
    { 
      key: 'remainingBalance', 
      header: 'Remaining Balance', 
      sortable: true, 
      render: (value: number) => <span className={styles.amountNegative}>{formatCurrency(value)}</span>
    },
    { 
      key: 'status', 
      header: 'Status', 
      sortable: true, 
      render: (value: string) => {
        const statusColors: Record<string, string> = {
          active: styles.statusActive,
          completed: styles.statusCompleted,
          overdue: styles.statusOverdue,
          pending: styles.statusPending,
        };
        return <span className={`${styles.statusBadge} ${statusColors[value] || styles.statusDefault}`}>{value.toUpperCase()}</span>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_: any, row: Loan) => (
        <div className={styles.actionButtons}>
          <Button
            variant="ghost"
            size="small"
            onClick={(e) => { e.stopPropagation(); handleView(row); }}
            aria-label="View loan details"
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            aria-label="Edit loan"
          >
            <Edit2 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={(e) => { e.stopPropagation(); handleDeleteClick(row); }}
            aria-label="Delete loan"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className={styles.loansPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Loans</h1>
          <Button leftIcon={<Plus size={16} />} variant="primary" onClick={() => navigate('/loans/add')}>
            Add Loan
          </Button>
        </div>
        <Card>
          <div className={styles.loadingContainer}>
            <p>Loading loan data...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loansPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Loans</h1>
          <Button leftIcon={<Plus size={16} />} variant="primary" onClick={() => navigate('/loans/add')}>
            Add Loan
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
    <div className={styles.loansPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Loans</h1>
        <Button leftIcon={<Plus size={16} />} variant="primary" onClick={() => navigate('/loans/add')}>
          Add Loan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <Card variant="primary">
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardHeader}>
              <Coins size={20} />
              <h3 className={styles.summaryCardTitle}>Total Loans</h3>
            </div>
            <p className={styles.summaryCardValue}>{summary.totalLoans}</p>
            <p className={styles.summaryCardSubtext}>{formatCurrency(summary.totalLoanAmount)}</p>
          </div>
        </Card>
        <Card variant="warning">
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardHeader}>
              <DollarSign size={20} />
              <h3 className={styles.summaryCardTitle}>Remaining Balance</h3>
            </div>
            <p className={styles.summaryCardValue}>{formatCurrency(summary.totalRemainingBalance)}</p>
            <p className={styles.summaryCardSubtext}>Across all loans</p>
          </div>
        </Card>
        <Card variant="success">
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardHeader}>
              <Calendar size={20} />
              <h3 className={styles.summaryCardTitle}>Monthly Payments</h3>
            </div>
            <p className={styles.summaryCardValue}>{formatCurrency(summary.totalMonthlyPayments)}</p>
            <p className={styles.summaryCardSubtext}>Due each month</p>
          </div>
        </Card>
        <Card variant="danger">
          <div className={styles.summaryCard}>
            <div className={styles.summaryCardHeader}>
              <TrendingUp size={20} />
              <h3 className={styles.summaryCardTitle}>Overdue</h3>
            </div>
            <p className={styles.summaryCardValue}>{summary.overdueLoans}</p>
            <p className={styles.summaryCardSubtext}>Loans need attention</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search loans..."
        actions={
          <>
            <select
              className={styles.filterSelect}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {getStatusOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
            >
              {getMemberOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <ChartCard title="Loan Status Distribution">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={loanStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {loanStatusData.map((entry, index) => (
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
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Loan Amount vs Remaining Balance">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={loanAmountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
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
                />
                <Bar dataKey="loanAmount" fill="#3b82f6" name="Loan Amount" />
                <Bar dataKey="remaining" fill="#ef4444" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Monthly Payment Breakdown">
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyPaymentData}>
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
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Area type="monotone" dataKey="principal" stackId="1" stroke="#10b981" fill="#10b981" name="Principal" />
                <Area type="monotone" dataKey="interest" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Interest" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Loans Table */}
      <Card title="Loans" subtitle={`${filteredLoans.length} loans`}>
        <Table
          columns={columns}
          data={filteredLoans}
          rowKey={(loan) => loan.id}
        />
      </Card>

      {/* View Loan Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeModals}
        title="Loan Details"
        size="lg"
      >
        {selectedLoan && (
          <div className={styles.loanDetails}>
            <div className={styles.loanDetailsGrid}>
              <div className={styles.detailItem}>
                <h4>Loan Name</h4>
                <p>{selectedLoan.name}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Lender</h4>
                <p>{selectedLoan.lender}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Loan Amount</h4>
                <p className={styles.amountPositive}>{formatCurrency(selectedLoan.loanAmount)}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Interest Rate</h4>
                <p>{formatPercentage(selectedLoan.interestRate)}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Term</h4>
                <p>{selectedLoan.term} months</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Monthly Installment</h4>
                <p className={styles.amountNeutral}>{formatCurrency(selectedLoan.monthlyInstallment)}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Total Amount to Pay</h4>
                <p className={styles.amountPositive}>{formatCurrency(selectedLoan.totalAmountToPay)}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Total Interest Payable</h4>
                <p className={styles.amountWarning}>{formatCurrency(selectedLoan.totalInterestPayable)}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Amount Paid</h4>
                <p className={styles.amountPositive}>{formatCurrency(selectedLoan.amountPaid)}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Remaining Balance</h4>
                <p className={styles.amountNegative}>{formatCurrency(selectedLoan.remainingBalance)}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Start Date</h4>
                <p>{new Date(selectedLoan.startDate).toLocaleDateString()}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>End Date</h4>
                <p>{new Date(selectedLoan.endDate).toLocaleDateString()}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Status</h4>
                <p>{selectedLoan.status.toUpperCase()}</p>
              </div>
              <div className={styles.detailItem}>
                <h4>Purpose</h4>
                <p>{selectedLoan.purpose}</p>
              </div>
              {selectedLoan.collateral && (
                <div className={styles.detailItem}>
                  <h4>Collateral</h4>
                  <p>{selectedLoan.collateral}</p>
                </div>
              )}
            </div>

            {selectedRepayments.length > 0 && (
              <div className={styles.repaymentsSection}>
                <h3>Repayment History</h3>
                <div className={styles.repaymentsList}>
                  {selectedRepayments.map(repayment => (
                    <div key={repayment.id} className={styles.repaymentItem}>
                      <div className={styles.repaymentHeader}>
                        <span className={styles.repaymentDate}>
                          {new Date(repayment.paymentDate).toLocaleDateString()}
                        </span>
                        <span className={`${styles.repaymentStatus} ${
                          repayment.status === 'on-time' ? styles.statusOnTime :
                          repayment.status === 'late' ? styles.statusLate :
                          styles.statusMissed
                        }`}>
                          {repayment.status.toUpperCase()}
                        </span>
                      </div>
                      <div className={styles.repaymentDetails}>
                        <p>Amount: {formatCurrency(repayment.amount)}</p>
                        <p>Principal: {formatCurrency(repayment.principalAmount)}</p>
                        <p>Interest: {formatCurrency(repayment.interestAmount)}</p>
                        <p>Remaining: {formatCurrency(repayment.remainingBalanceAfterPayment)}</p>
                        {repayment.notes && <p>Notes: {repayment.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.modalActions}>
              <Button variant="primary" onClick={() => setRepaymentModalOpen(true)}>
                Add Repayment
              </Button>
              <Button variant="secondary" onClick={closeModals}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Repayment Modal */}
      <Modal
        isOpen={repaymentModalOpen}
        onClose={closeModals}
        title="Add Repayment"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleAddRepayment({ amount: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'cash' }); }}>
          <div className={styles.formGroup}>
            <label htmlFor="repaymentAmount">Payment Amount *</label>
            <input
              type="number"
              id="repaymentAmount"
              required
              min="0.01"
              step="0.01"
              placeholder="Enter payment amount"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="paymentDate">Payment Date *</label>
            <input
              type="date"
              id="paymentDate"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="paymentMethod">Payment Method *</label>
            <select id="paymentMethod" required>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="repaymentNotes">Notes</label>
            <textarea
              id="repaymentNotes"
              rows={3}
              placeholder="Optional notes..."
            />
          </div>
          <div className={styles.modalActions}>
            <Button type="submit" variant="primary" loading={actionLoading}>
              Add Repayment
            </Button>
            <Button type="button" variant="secondary" onClick={closeModals}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Loan Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={closeModals}
        title="Edit Loan"
        size="md"
      >
        {selectedLoan && (
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const data = {
              name: formData.get('editLoanName') as string,
              lender: formData.get('editLender') as string,
              loanAmount: Number(formData.get('editLoanAmount')),
              interestRate: Number(formData.get('editInterestRate')),
              term: Number(formData.get('editTerm')),
              startDate: formData.get('editStartDate'),
              endDate: formData.get('editEndDate'),
              purpose: formData.get('editPurpose') as string,
              collateral: formData.get('editCollateral') as string || undefined,
              status: formData.get('editStatus') as 'active' | 'completed' | 'overdue' | 'pending',
            };
            handleEditSubmit(data);
          }}>
            <div className={styles.formGroup}>
              <label htmlFor="editLoanName">Loan Name *</label>
              <input
                type="text"
                id="editLoanName"
                name="editLoanName"
                required
                defaultValue={selectedLoan.name}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="editLender">Lender *</label>
              <input
                type="text"
                id="editLender"
                name="editLender"
                required
                defaultValue={selectedLoan.lender}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="editLoanAmount">Loan Amount *</label>
              <input
                type="number"
                id="editLoanAmount"
                name="editLoanAmount"
                required
                min="0"
                step="0.01"
                defaultValue={selectedLoan.loanAmount}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="editInterestRate">Interest Rate (%) *</label>
              <input
                type="number"
                id="editInterestRate"
                name="editInterestRate"
                required
                min="0"
                max="100"
                step="0.01"
                defaultValue={selectedLoan.interestRate}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="editTerm">Term (months) *</label>
              <input
                type="number"
                id="editTerm"
                name="editTerm"
                required
                min="1"
                defaultValue={selectedLoan.term}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="editStartDate">Start Date *</label>
              <input
                type="date"
                id="editStartDate"
                name="editStartDate"
                required
                defaultValue={selectedLoan.startDate.substring(0, 10)}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="editEndDate">End Date *</label>
              <input
                type="date"
                id="editEndDate"
                name="editEndDate"
                required
                defaultValue={selectedLoan.endDate.substring(0, 10)}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="editPurpose">Purpose *</label>
              <input
                type="text"
                id="editPurpose"
                name="editPurpose"
                required
                defaultValue={selectedLoan.purpose}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="editCollateral">Collateral</label>
              <input
                type="text"
                id="editCollateral"
                name="editCollateral"
                defaultValue={selectedLoan.collateral || ''}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="editStatus">Status *</label>
              <select id="editStatus" name="editStatus" required defaultValue={selectedLoan.status}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <Button type="submit" variant="primary" loading={actionLoading}>
                Update Loan
              </Button>
              <Button type="button" variant="secondary" onClick={closeModals}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={closeModals}
        onConfirm={handleDeleteConfirm}
        title="Delete Loan"
        message={`Are you sure you want to delete the loan "${selectedLoan?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={actionLoading}
      />
    </div>
  );
};

export default Loans;
