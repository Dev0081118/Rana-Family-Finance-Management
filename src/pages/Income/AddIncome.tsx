import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import { FormInput, FormSelect, FormTextarea } from '../../components/common/FormInput';
import { incomeService } from '../../services/api';
import { authService } from '../../services/api';
import styles from './AddIncome.module.css';

interface FormData {
  amount: string;
  category: string;
  date: string;
  description: string;
}

interface FormErrors {
  amount?: string;
  category?: string;
  date?: string;
  description?: string;
}

const AddIncome: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const incomeCategories = [
    'Salary',
    'Freelance',
    'Business',
    'Investment Returns',
    'Rental Income',
    'Gift',
    'Other'
  ];

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    // Check if user is authenticated
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

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
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
      await incomeService.create({
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        description: formData.description || undefined,
      });

      setSuccess('Income added successfully!');
      setFormData({
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });

      // Refresh the parent page after a short delay
      setTimeout(() => {
        navigate('/income', { state: { refresh: true } });
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add income. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className={styles.addIncomePage}>
      <div className={styles.pageHeader}>
        <button className={styles.backButton} onClick={() => navigate('/income')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.formTitle}>Add Income</h1>
      </div>

      {success && <div className={styles.successMessage}>{success}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}

      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
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

          <FormSelect
            label="Category"
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            error={errors.category}
          >
            <option value="">Select a category</option>
            {incomeCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </FormSelect>

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
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              placeholder="Enter description (optional)"
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/income')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Add Income
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddIncome;
