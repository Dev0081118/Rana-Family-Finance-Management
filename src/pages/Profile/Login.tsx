import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { authService } from '../../services/api';
import styles from './Login.module.css';

type AuthMode = 'login' | 'register';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'member';
}

interface LoginErrors {
  email?: string;
  password?: string;
}

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'member',
  });
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateLogin = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!loginData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }

    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = (): boolean => {
    const newErrors: RegisterErrors = {};

    if (!registerData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (registerData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!registerData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!registerData.password) {
      newErrors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (loginErrors[name as keyof LoginErrors]) {
      setLoginErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setError('');
    setSuccess('');
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    if (registerErrors[name as keyof RegisterErrors]) {
      setRegisterErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setError('');
    setSuccess('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateLogin()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(loginData.email, loginData.password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateRegister()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(
        registerData.name,
        registerData.email,
        registerData.password,
        registerData.role
      );
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
    setSuccess('');
    setLoginErrors({});
    setRegisterErrors({});
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>Home Finance App</h1>
        <p className={styles.loginSubtitle}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {error && <div className={styles.errorMessage} style={{ marginBottom: 'var(--space-4)' }}>{error}</div>}
        {success && <div className={styles.successMessage} style={{ marginBottom: 'var(--space-4)' }}>{success}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="login-email" className={styles.formLabel}>Email</label>
              <input
                type="email"
                id="login-email"
                name="email"
                className={`${styles.formInput} ${loginErrors.email ? styles.error : ''}`}
                value={loginData.email}
                onChange={handleLoginChange}
                placeholder="Enter your email"
              />
              {loginErrors.email && <span className={styles.errorMessage}>{loginErrors.email}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="login-password" className={styles.formLabel}>Password</label>
              <input
                type="password"
                id="login-password"
                name="password"
                className={`${styles.formInput} ${loginErrors.password ? styles.error : ''}`}
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Enter your password"
              />
              {loginErrors.password && <span className={styles.errorMessage}>{loginErrors.password}</span>}
            </div>

            <Button type="submit" className={styles.loginButton} loading={loading} disabled={loading}>
              Sign In
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="register-name" className={styles.formLabel}>Full Name</label>
              <input
                type="text"
                id="register-name"
                name="name"
                className={`${styles.formInput} ${registerErrors.name ? styles.error : ''}`}
                value={registerData.name}
                onChange={handleRegisterChange}
                placeholder="Enter your full name"
              />
              {registerErrors.name && <span className={styles.errorMessage}>{registerErrors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="register-email" className={styles.formLabel}>Email</label>
              <input
                type="email"
                id="register-email"
                name="email"
                className={`${styles.formInput} ${registerErrors.email ? styles.error : ''}`}
                value={registerData.email}
                onChange={handleRegisterChange}
                placeholder="Enter your email"
              />
              {registerErrors.email && <span className={styles.errorMessage}>{registerErrors.email}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="register-password" className={styles.formLabel}>Password</label>
              <input
                type="password"
                id="register-password"
                name="password"
                className={`${styles.formInput} ${registerErrors.password ? styles.error : ''}`}
                value={registerData.password}
                onChange={handleRegisterChange}
                placeholder="Create a password (min 6 characters)"
              />
              {registerErrors.password && <span className={styles.errorMessage}>{registerErrors.password}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="register-confirmPassword" className={styles.formLabel}>Confirm Password</label>
              <input
                type="password"
                id="register-confirmPassword"
                name="confirmPassword"
                className={`${styles.formInput} ${registerErrors.confirmPassword ? styles.error : ''}`}
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                placeholder="Confirm your password"
              />
              {registerErrors.confirmPassword && <span className={styles.errorMessage}>{registerErrors.confirmPassword}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="register-role" className={styles.formLabel}>Role</label>
              <select
                id="register-role"
                name="role"
                className={styles.formInput}
                value={registerData.role}
                onChange={handleRegisterChange}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <Button type="submit" className={styles.loginButton} loading={loading} disabled={loading}>
              Create Account
            </Button>
          </form>
        )}

        <div className={styles.switchMode}>
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button type="button" className={styles.switchButton} onClick={toggleMode}>
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button type="button" className={styles.switchButton} onClick={toggleMode}>
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* <div className={styles.demoNotice}>
          <strong>Demo Mode:</strong> Register a new account to test the forms.
        </div> */}
      </div>
    </div>
  );
};

export default Login;
