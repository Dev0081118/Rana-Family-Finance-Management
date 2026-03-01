import {
  Transaction,
  Member,
  Category,
  SummaryCard,
  ChartData,
  TimeSeriesData,
  CategoryBreakdown,
  MemberContribution,
  Investment,
  SavingsAccount,
} from '../types';

export const members: Member[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', avatar: '', color: '#0ea5e9' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: '', color: '#10b981' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', avatar: '', color: '#f59e0b' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', avatar: '', color: '#ef4444' },
];

export const categories: Category[] = [
  { id: '1', name: 'Salary', type: 'income', color: '#10b981' },
  { id: '2', name: 'Freelance', type: 'income', color: '#3b82f6' },
  { id: '3', name: 'Investments', type: 'income', color: '#8b5cf6' },
  { id: '4', name: 'Food & Dining', type: 'expense', color: '#ef4444' },
  { id: '5', name: 'Transportation', type: 'expense', color: '#f59e0b' },
  { id: '6', name: 'Entertainment', type: 'expense', color: '#ec4899' },
  { id: '7', name: 'Shopping', type: 'expense', color: '#6366f1' },
  { id: '8', name: 'Bills & Utilities', type: 'expense', color: '#64748b' },
  { id: '9', name: 'Healthcare', type: 'expense', color: '#14b8a6' },
  { id: '10', name: 'Education', type: 'expense', color: '#a855f7' },
];

export const transactions: Transaction[] = [
  { id: '1', type: 'income', amount: 5000, category: 'Salary', description: 'Monthly salary', date: '2024-01-15', memberId: '1', memberName: 'John Doe', createdAt: '2024-01-15' },
  { id: '2', type: 'income', amount: 3500, category: 'Salary', description: 'Monthly salary', date: '2024-01-15', memberId: '2', memberName: 'Jane Smith', createdAt: '2024-01-15' },
  { id: '3', type: 'income', amount: 2000, category: 'Freelance', description: 'Project payment', date: '2024-01-10', memberId: '1', memberName: 'John Doe', createdAt: '2024-01-10' },
  { id: '4', type: 'expense', amount: 150, category: 'Food & Dining', description: 'Grocery shopping', date: '2024-01-20', memberId: '1', memberName: 'John Doe', createdAt: '2024-01-20' },
  { id: '5', type: 'expense', amount: 80, category: 'Transportation', description: 'Gas', date: '2024-01-18', memberId: '2', memberName: 'Jane Smith', createdAt: '2024-01-18' },
  { id: '6', type: 'expense', amount: 200, category: 'Entertainment', description: 'Movie tickets', date: '2024-01-25', memberId: '3', memberName: 'Bob Johnson', createdAt: '2024-01-25' },
  { id: '7', type: 'expense', amount: 500, category: 'Shopping', description: 'Clothes', date: '2024-01-22', memberId: '4', memberName: 'Alice Brown', createdAt: '2024-01-22' },
  { id: '8', type: 'expense', amount: 300, category: 'Bills & Utilities', description: 'Electric bill', date: '2024-01-05', memberId: '1', memberName: 'John Doe', createdAt: '2024-01-05' },
  { id: '9', type: 'expense', amount: 100, category: 'Healthcare', description: 'Pharmacy', date: '2024-01-12', memberId: '2', memberName: 'Jane Smith', createdAt: '2024-01-12' },
  { id: '10', type: 'income', amount: 1500, category: 'Investments', description: 'Dividend payout', date: '2024-01-30', memberId: '3', memberName: 'Bob Johnson', createdAt: '2024-01-30' },
];

export const investments: Investment[] = [
  { id: '1', name: 'Stock Portfolio', type: 'Stocks', amountInvested: 10000, currentValue: 12500, purchaseDate: '2023-06-15', roi: 25, assetAllocation: 'Tech' },
  { id: '2', name: 'Bond Fund', type: 'Bonds', amountInvested: 5000, currentValue: 5200, purchaseDate: '2023-09-20', roi: 4, assetAllocation: 'Government' },
  { id: '3', name: 'Real Estate Investment', type: 'Real Estate', amountInvested: 20000, currentValue: 22000, purchaseDate: '2022-12-10', roi: 10, assetAllocation: 'Commercial' },
  { id: '4', name: 'Crypto Wallet', type: 'Cryptocurrency', amountInvested: 3000, currentValue: 4500, purchaseDate: '2024-01-05', roi: 50, assetAllocation: 'Mixed' },
];

export const savingsAccounts: SavingsAccount[] = [
  { id: '1', name: 'Emergency Fund', balance: 15000, interestRate: 2.5, type: 'emergency' },
  { id: '2', name: 'Vacation Fund', balance: 5000, interestRate: 1.5, type: 'goal' },
  { id: '3', name: 'Retirement Account', balance: 50000, interestRate: 5.0, type: 'retirement' },
  { id: '4', name: 'General Savings', balance: 10000, interestRate: 2.0, type: 'general' },
];

// Helper functions to generate chart data
export const getMonthlyIncomeData = (): TimeSeriesData[] => [
  { date: 'Jan', value: 10500 },
  { date: 'Feb', value: 11200 },
  { date: 'Mar', value: 10800 },
  { date: 'Apr', value: 11500 },
  { date: 'May', value: 12000 },
  { date: 'Jun', value: 11800 },
  { date: 'Jul', value: 12200 },
  { date: 'Aug', value: 12500 },
  { date: 'Sep', value: 11900 },
  { date: 'Oct', value: 12300 },
  { date: 'Nov', value: 12800 },
  { date: 'Dec', value: 13000 },
];

export const getMonthlyExpenseData = (): TimeSeriesData[] => [
  { date: 'Jan', value: 4200 },
  { date: 'Feb', value: 4500 },
  { date: 'Mar', value: 4300 },
  { date: 'Apr', value: 4600 },
  { date: 'May', value: 4800 },
  { date: 'Jun', value: 4700 },
  { date: 'Jul', value: 4900 },
  { date: 'Aug', value: 5000 },
  { date: 'Sep', value: 4800 },
  { date: 'Oct', value: 5100 },
  { date: 'Nov', value: 5200 },
  { date: 'Dec', value: 5500 },
];

export const getIncomeByCategory = (): CategoryBreakdown[] => [
  { category: 'Salary', amount: 45000, percentage: 70, color: '#10b981' },
  { category: 'Freelance', amount: 12000, percentage: 19, color: '#3b82f6' },
  { category: 'Investments', amount: 8000, percentage: 11, color: '#8b5cf6' },
];

export const getExpenseByCategory = (): CategoryBreakdown[] => [
  { category: 'Food & Dining', amount: 8000, percentage: 22, color: '#ef4444' },
  { category: 'Transportation', amount: 4500, percentage: 12, color: '#f59e0b' },
  { category: 'Entertainment', amount: 3000, percentage: 8, color: '#ec4899' },
  { category: 'Shopping', amount: 6000, percentage: 17, color: '#6366f1' },
  { category: 'Bills & Utilities', amount: 7000, percentage: 19, color: '#64748b' },
  { category: 'Healthcare', amount: 2500, percentage: 7, color: '#14b8a6' },
  { category: 'Education', amount: 4000, percentage: 11, color: '#a855f7' },
  { category: 'Other', amount: 2000, percentage: 4, color: '#6b7280' },
];

export const getIncomeByMember = (): MemberContribution[] => [
  { memberId: '1', memberName: 'John Doe', amount: 28000, percentage: 44, color: '#0ea5e9' },
  { memberId: '2', memberName: 'Jane Smith', amount: 22000, percentage: 34, color: '#10b981' },
  { memberId: '3', memberName: 'Bob Johnson', amount: 9000, percentage: 14, color: '#f59e0b' },
  { memberId: '4', memberName: 'Alice Brown', amount: 5000, percentage: 8, color: '#ef4444' },
];

export const getExpenseByMember = (): MemberContribution[] => [
  { memberId: '1', memberName: 'John Doe', amount: 15000, percentage: 42, color: '#0ea5e9' },
  { memberId: '2', memberName: 'Jane Smith', amount: 12000, percentage: 33, color: '#10b981' },
  { memberId: '3', memberName: 'Bob Johnson', amount: 5000, percentage: 14, color: '#f59e0b' },
  { memberId: '4', memberName: 'Alice Brown', amount: 4000, percentage: 11, color: '#ef4444' },
];

export const getSavingsGrowthData = (): TimeSeriesData[] => [
  { date: 'Jan', value: 50000 },
  { date: 'Feb', value: 52000 },
  { date: 'Mar', value: 54000 },
  { date: 'Apr', value: 56000 },
  { date: 'May', value: 58000 },
  { date: 'Jun', value: 60000 },
  { date: 'Jul', value: 62000 },
  { date: 'Aug', value: 64000 },
  { date: 'Sep', value: 66000 },
  { date: 'Oct', value: 68000 },
  { date: 'Nov', value: 70000 },
  { date: 'Dec', value: 72000 },
];

export const getDepositVsWithdrawData = (): ChartData[] => [
  { name: 'Deposits', value: 25000, color: '#10b981' },
  { name: 'Withdrawals', value: 8000, color: '#ef4444' },
];

export const getInvestmentDistribution = (): CategoryBreakdown[] => [
  { category: 'Stocks', amount: 12500, percentage: 35, color: '#0ea5e9' },
  { category: 'Bonds', amount: 5200, percentage: 15, color: '#10b981' },
  { category: 'Real Estate', amount: 22000, percentage: 62, color: '#f59e0b' },
  { category: 'Crypto', amount: 4500, percentage: 13, color: '#8b5cf6' },
];

export const getNetWorthData = (): TimeSeriesData[] => [
  { date: 'Jan', value: 125000 },
  { date: 'Feb', value: 128000 },
  { date: 'Mar', value: 132000 },
  { date: 'Apr', value: 135000 },
  { date: 'May', value: 140000 },
  { date: 'Jun', value: 145000 },
  { date: 'Jul', value: 148000 },
  { date: 'Aug', value: 152000 },
  { date: 'Sep', value: 156000 },
  { date: 'Oct', value: 160000 },
  { date: 'Nov', value: 165000 },
  { date: 'Dec', value: 170000 },
];

export const getYearlyIncomeExpense = (): (TimeSeriesData & { income: number; expenses: number })[] => [
  { date: '2020', income: 100000, expenses: 60000, value: 100000 },
  { date: '2021', income: 110000, expenses: 65000, value: 110000 },
  { date: '2022', income: 120000, expenses: 70000, value: 120000 },
  { date: '2023', income: 130000, expenses: 75000, value: 130000 },
  { date: '2024', income: 145000, expenses: 80000, value: 145000 },
];

export const getTopExpenseCategories = (): CategoryBreakdown[] => [
  { category: 'Bills & Utilities', amount: 7000, percentage: 19, color: '#64748b' },
  { category: 'Food & Dining', amount: 8000, percentage: 22, color: '#ef4444' },
  { category: 'Shopping', amount: 6000, percentage: 17, color: '#6366f1' },
  { category: 'Transportation', amount: 4500, percentage: 12, color: '#f59e0b' },
  { category: 'Entertainment', amount: 3000, percentage: 8, color: '#ec4899' },
];

export const getSummaryCards = (): SummaryCard[] => [
  {
    title: 'Total Income',
    value: 128500,
    change: 12.5,
    changeType: 'positive',
    sparklineData: [10500, 11200, 10800, 11500, 12000, 11800, 12200, 12500, 11900, 12300, 12800, 13000],
  },
  {
    title: 'Total Expenses',
    value: 56000,
    change: -5.2,
    changeType: 'negative',
    sparklineData: [4200, 4500, 4300, 4600, 4800, 4700, 4900, 5000, 4800, 5100, 5200, 5500],
  },
  {
    title: 'Total Savings',
    value: 72500,
    change: 8.3,
    changeType: 'positive',
    sparklineData: [50000, 52000, 54000, 56000, 58000, 60000, 62000, 64000, 66000, 68000, 70000, 72000],
  },
  {
    title: 'Total Investments',
    value: 44200,
    change: 15.7,
    changeType: 'positive',
    sparklineData: [35000, 37000, 39000, 40000, 41000, 42000, 43000, 44000, 45000, 46000, 47000, 48000],
  },
  {
    title: 'Net Worth',
    value: 170000,
    change: 10.2,
    changeType: 'positive',
    sparklineData: [125000, 128000, 132000, 135000, 140000, 145000, 148000, 152000, 156000, 160000, 165000, 170000],
  },
];