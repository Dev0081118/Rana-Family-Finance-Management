import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';
import Button from '../../components/common/Button';
import { FormInput, FormSelect } from '../../components/common/FormInput';
import { investmentService } from '../../services/api';
import { authService } from '../../services/api';
import styles from './AddInvestment.module.css';

interface FormData {
  assetName: string;
  assetType: string;
  investedAmount: string;
  currentValue: string;
  purchaseDate: string;
}

interface FormErrors {
  assetName?: string;
  assetType?: string;
  investedAmount?: string;
  currentValue?: string;
  purchaseDate?: string;
}

const AddInvestment: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    assetName: '',
    assetType: '',
    investedAmount: '',
    currentValue: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const assetTypes = [
    'Stocks',
    'Bonds',
    'Mutual Funds',
    'Cryptocurrency',
    'Real Estate',
    'Gold',
    'Fixed Deposit',
    'PPF',
    'SIP',
    'Other'
  ];

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.assetName.trim()) {
      newErrors.assetName = 'Asset name is required';
    }

    if (!formData.assetType) {
      newErrors.assetType = 'Asset type is required';
    }

    if (!formData.investedAmount.trim()) {
      newErrors.investedAmount = 'Invested amount is required';
    } else if (isNaN(Number(formData.investedAmount)) || Number(formData.investedAmount) <= 0) {
      newErrors.investedAmount = 'Invested amount must be a positive number';
    }

    if (!formData.currentValue.trim()) {
      newErrors.currentValue = 'Current value is required';
    } else if (isNaN(Number(formData.currentValue)) || Number(formData.currentValue) < 0) {
      newErrors.currentValue = 'Current value must be a non-negative number';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      await investmentService.create({
        assetName: formData.assetName.trim(),
        assetType: formData.assetType,
        investedAmount: Number(formData.investedAmount),
        currentValue: Number(formData.currentValue),
        purchaseDate: formData.purchaseDate,
      });

      setSuccess('Investment added successfully!');
      setFormData({
        assetName: '',
        assetType: '',
        investedAmount: '',
        currentValue: '',
        purchaseDate: new Date().toISOString().split('T')[0],
      });

      setTimeout(() => {
        navigate('/investments', { state: { refresh: true } });
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add investment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className={styles.addInvestmentPage}>
      <div className={styles.pageHeader}>
        <button className={styles.backButton} onClick={() => navigate('/investments')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.formTitle}>Add Investment</h1>
      </div>

      {success && <div className={styles.successMessage}>{success}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}

      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <FormInput
            label="Asset Name"
            name="assetName"
            required
            value={formData.assetName}
            onChange={handleChange}
            error={errors.assetName}
            placeholder="e.g., Apple Stocks, Mutual Fund, etc."
          />

          <FormSelect
            label="Asset Type"
            name="assetType"
            required
            value={formData.assetType}
            onChange={handleChange}
            error={errors.assetType}
          >
            <option value="">Select an asset type</option>
            {assetTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </FormSelect>

          <FormInput
            label="Invested Amount"
            name="investedAmount"
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.investedAmount}
            onChange={handleChange}
            error={errors.investedAmount}
            placeholder="Enter invested amount"
          />

          <FormInput
            label="Current Value"
            name="currentValue"
            type="number"
            step="0.01"
            min="0"
            required
            value={formData.currentValue}
            onChange={handleChange}
            error={errors.currentValue}
            placeholder="Enter current value"
          />

          <FormInput
            label="Purchase Date"
            name="purchaseDate"
            type="date"
            required
            value={formData.purchaseDate}
            onChange={handleChange}
            error={errors.purchaseDate}
          />
        </div>

        <div className={styles.formActions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/investments')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            leftIcon={<Wallet size={16} />}
          >
            Add Investment
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddInvestment;
