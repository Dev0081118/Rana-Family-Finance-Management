import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Savings from './pages/Savings';
import Investments from './pages/Investments';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Profile/Login';
import AddIncome from './pages/Income/AddIncome';
import AddExpense from './pages/Expenses/AddExpense';
import AddSavings from './pages/Savings/AddSavings';
import AddInvestment from './pages/Investments/AddInvestment';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './styles/global.css';

const App: React.FC = () => {
  const [currentMonth] = useState('January 2024');

  const handleMonthChange = () => {
    // TODO: Implement month selector modal
    console.log('Month change clicked');
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/income" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <Income />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/income/add" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <AddIncome />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <Expenses />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/expenses/add" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <AddExpense />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/savings" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <Savings />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/savings/add" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <AddSavings />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/investments" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <Investments />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/investments/add" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <AddInvestment />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <Analytics />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
