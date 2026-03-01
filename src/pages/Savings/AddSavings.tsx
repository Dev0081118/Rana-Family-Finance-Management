import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Button from '../../components/common/Button';
import { FormInput, FormTextarea } from '../../components/common/FormInput';
import { savingsService } from '../../services/api';
import { authService } from '../../services/api';
import styles from './AddSavings.module.css';

interface FormData {
  type: 'deposit' | 'withdraw';
  amount: string;
  date: string;
  note: string;
}

interface FormErrors {
  type?: string;
  amount?: string;
  date?: string;
  note?: string;
}

const AddSavings: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    type: 'deposit',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setError('');
    setSuccess('');
  };

  const handleTypeChange = (type: 'deposit' | 'withdraw') => {
    setFormData(prev => ({ ...prev, type }));
    if (errors.type) {
      setErrors(prev => ({ ...prev, type: undefined }));
    }
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await savingsService.create({
        type: formData.type,
        amount: Number(formData.amount),
        date: formData.date,
        note: formData.note || undefined,
      });

      setSuccess('Savings transaction added successfully!');
      setFormData({
        type: 'deposit',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
      });

      setTimeout(() => {
        navigate('/savings', { state: { refresh: true } });
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add savings transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className={styles.addSavingsPage}>
      <div className={styles.pageHeader}>
        <button className={styles.backButton} onClick={() => navigate('/savings')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.formTitle}>Add Savings Transaction</h1>
      </div>

      {success && <div className={styles.successMessage}>{success}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}

      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.fullWidth}>
            <label className={styles.typeLabel}>Transaction Type</label>
            <div className={styles.typeSelector}>
              <div
                className={`${styles.typeOption} ${formData.type === 'deposit' ? styles.selected : ''}`}
                onClick={() => handleTypeChange('deposit')}
              >
                <ArrowUpRight size={20} style={{ marginRight: '8px', display: 'inline' }} />
                Deposit
              </div>
              <div
                className={`${styles.typeOption} ${formData.type === 'withdraw' ? styles.selected : ''}`}
                onClick={() => handleTypeChange('withdraw')}
              >
                <ArrowDownRight size={20} style={{ marginRight: '8px', display: 'inline' }} />
                Withdraw
              </div>
            </div>
            {errors.type && <span className={styles.errorMessage}>{errors.type}</span>}
          </div>

          <FormInput
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.amount}
            onChange={handleChange}
            error={errors.amount}
            placeholder="Enter amount"
          />

          <FormInput
            label="Date"
            name="date"
            type="date"
            required
            value={formData.date}
            onChange={handleChange}
            error={errors.date}
          />

          <div className={styles.fullWidth}>
            <FormTextarea
              label="Note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              error={errors.note}
              placeholder="Enter note (optional)"
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/savings')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {formData.type === 'deposit' ? 'Add Deposit' : 'Add Withdrawal'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddSavings;
