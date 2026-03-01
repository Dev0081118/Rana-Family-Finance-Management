import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
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
import './styles/global.css';

const App: React.FC = () => {
  const [currentMonth] = useState('January 2024');

  const handleMonthChange = () => {
    // TODO: Implement month selector modal
    console.log('Month change clicked');
  };

  return (
    <ThemeProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          <Route path="/" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <Dashboard />
            </MainLayout>
          } />
          <Route path="/income" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <Income />
            </MainLayout>
          } />
          <Route path="/income/add" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <AddIncome />
            </MainLayout>
          } />
          <Route path="/expenses" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <Expenses />
            </MainLayout>
          } />
          <Route path="/expenses/add" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <AddExpense />
            </MainLayout>
          } />
          <Route path="/savings" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <Savings />
            </MainLayout>
          } />
          <Route path="/savings/add" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <AddSavings />
            </MainLayout>
          } />
          <Route path="/investments" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <Investments />
            </MainLayout>
          } />
          <Route path="/investments/add" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <AddInvestment />
            </MainLayout>
          } />
          <Route path="/analytics" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <Analytics />
            </MainLayout>
          } />
          <Route path="/profile" element={
            <MainLayout currentMonth={currentMonth} onMonthChange={handleMonthChange}>
              <Profile />
            </MainLayout>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;