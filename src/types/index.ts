import React from 'react';

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
}

// Finance types
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  date: string;
  memberId: string;
  memberName: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
}

// Summary types
export interface SummaryCard {
  title: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  sparklineData?: number[];
}

// Chart types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  [key: string]: any;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MemberContribution {
  memberId: string;
  memberName: string;
  amount: number;
  percentage: number;
  color: string;
}

// Investment types
export interface Investment {
  id: string;
  name: string;
  type: string;
  amountInvested: number;
  currentValue: number;
  purchaseDate: string;
  roi: number;
  assetAllocation: string;
}

// Savings types
export interface SavingsAccount {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  type: 'emergency' | 'goal' | 'retirement' | 'general';
}

export interface SavingsTransaction {
  id: string;
  accountId: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  description: string;
}

// Filter types
export interface DateFilter {
  month: number;
  year: number;
}

export interface TransactionFilters {
  dateRange: DateFilter;
  memberIds: string[];
  categories: string[];
  searchQuery?: string;
}

// Table types
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

// Theme types
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}