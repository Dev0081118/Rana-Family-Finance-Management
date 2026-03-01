import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Save, User } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { authService } from '../../services/api';
import styles from './Profile.module.css';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  // Memoize currentUser to prevent infinite loop
  // Returns same object reference across renders unless localStorage changes
  const currentUser = useMemo(() => authService.getCurrentUser(), []);

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Don't run if no user
    if (!currentUser) {
      setError('No user logged in');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchUserProfile = async () => {
      try {
        if (!cancelled) setLoading(true);
        if (!cancelled) setError('');
        
        // Use the user data from localStorage (populated during login/register)
        if (currentUser && !cancelled) {
          setUser(currentUser);
          setFormData({
            name: currentUser.name,
            email: currentUser.email,
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to fetch profile');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      cancelled = true;
    };
  }, [currentUser]); // currentUser is memoized, stable reference

  const handleSave = async () => {
    try {
      // TODO: Implement profile update API call
      // await authService.updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      if (user) {
        setUser({ ...user, ...formData });
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
      });
    }
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className={styles.profilePage}>
        <Card>
          <p>Loading profile...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profilePage}>
        <Card>
          <p className={styles.errorMessage}>{error}</p>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.profilePage}>
        <Card>
          <p>No user data available. Please log in.</p>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? '#0ea5e9' : '#10b981';
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar} style={{ backgroundColor: getRoleColor(user.role) }}>
          {getInitials(user.name)}
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{user.name}</h1>
          <p className={styles.profileEmail}>{user.email}</p>
          <span className={styles.profileRole} style={{ backgroundColor: getRoleColor(user.role) }}>
            {user.role === 'admin' ? 'Admin' : 'Member'}
          </span>
        </div>
      </div>

      <Card title="Personal Information" className={styles.profileSection}>
        {success && <div className={styles.successMessage}>{success}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Full Name</label>
          {isEditing ? (
            <input
              type="text"
              className={styles.formInput}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
            />
          ) : (
            <p className={styles.formValue}>{user.name}</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Email Address</label>
          {isEditing ? (
            <input
              type="email"
              className={styles.formInput}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
            />
          ) : (
            <p className={styles.formValue}>{user.email}</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Role</label>
          <p className={styles.formValue}>
            <span className={styles.roleBadge} style={{ backgroundColor: getRoleColor(user.role) }}>
              {user.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end' }}>
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button leftIcon={<Save size={16} />} onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </Card>

      {/* Note: Family members would require a separate API endpoint to fetch all users */}
      {/* For now, we only show the current logged-in user's profile */}
    </div>
  );
};

export default Profile;