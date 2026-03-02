import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Save, User, Users as UsersIcon, Edit2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { authService } from '../../services/api';
import styles from './Profile.module.css';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface Member extends User {
  // Additional fields if needed
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'member' as 'admin' | 'member',
  });
  const [editMode, setEditMode] = useState<'profile' | 'members'>('profile');

  // Memoize currentUser to prevent infinite loop
  const currentUser = useMemo(() => authService.getCurrentUser(), []);

  // Track mounted state to prevent state updates after unmount
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Parse URL query parameters to determine mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'edit') {
      setEditMode('profile');
      setIsEditing(true);
    } else if (mode === 'members') {
      setEditMode('members');
    }
  }, []);

  // Fetch user profile or members based on mode
  useEffect(() => {
    if (!currentUser) {
      setError('No user logged in');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        if (!cancelled) setLoading(true);
        if (!cancelled) setError('');

        if (editMode === 'profile') {
          // Use user data from localStorage
          setUser(currentUser);
          setFormData({
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
          });
        } else if (editMode === 'members' && currentUser.role === 'admin') {
          // Fetch all users for admin
          const response = await authService.getAllUsers();
          if (!cancelled) {
            setMembers(response.data.users);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to fetch data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [currentUser, editMode]);

  const handleSaveProfile = async () => {
    try {
      const response = await authService.updateProfile({
        name: formData.name,
        email: formData.email,
      });
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Update local user state
      const updatedUser = response.data.user;
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleSaveMember = async (memberId: string) => {
    try {
      const response = await authService.updateUser(memberId, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });
      
      setSuccess(`Member ${response.data.user.name} updated successfully!`);
      setEditingMember(null);
      
      // Update members list
      setMembers(members.map(m => m._id === memberId ? response.data.user : m));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update member');
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingMember(null);
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
    setError('');
  };

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

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    if (editMode === 'profile' || editingMember) {
      if (editingMember) {
        handleSaveMember(editingMember._id);
      } else {
        handleSaveProfile();
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.profilePage}>
        <Card>
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  if (error && !editingMember) {
    return (
      <div className={styles.profilePage}>
        <Card>
          <p className={styles.errorMessage}>{error}</p>
        </Card>
      </div>
    );
  }

  if (!user && editMode === 'profile') {
    return (
      <div className={styles.profilePage}>
        <Card>
          <p>No user data available. Please log in.</p>
        </Card>
      </div>
    );
  }

  // Render Member Management for Admins
  if (editMode === 'members') {
    if (currentUser?.role !== 'admin') {
      return (
        <div className={styles.profilePage}>
          <Card>
            <p className={styles.errorMessage}>Access denied. Admin privileges required.</p>
          </Card>
        </div>
      );
    }

    return (
      <div className={styles.profilePage}>
        <div className={styles.profileHeader}>
          <div className={styles.profileAvatar} style={{ backgroundColor: getRoleColor('admin') }}>
            <UsersIcon size={32} />
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>Manage Members</h1>
            <p className={styles.profileEmail}>View and manage all family members</p>
          </div>
        </div>

        <Card title="Family Members" className={styles.membersSection}>
          {success && <div className={styles.successMessage}>{success}</div>}
          
          {members.length === 0 ? (
            <p>No members found.</p>
          ) : (
            <div className={styles.membersList}>
              {members.map((member) => (
                <div key={member._id} className={styles.memberCard}>
                  <div className={styles.memberInfo}>
                    <div 
                      className={styles.memberAvatar} 
                      style={{ backgroundColor: getRoleColor(member.role) }}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div className={styles.memberDetails}>
                      <h3 className={styles.memberName}>{member.name}</h3>
                      <p className={styles.memberEmail}>{member.email}</p>
                      <span 
                        className={styles.memberRoleBadge} 
                        style={{ backgroundColor: getRoleColor(member.role) }}
                      >
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.memberActions}>
                    <Button
                      variant="secondary"
                      size="small"
                      leftIcon={<Edit2 size={14} />}
                      onClick={() => handleEditMember(member)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Edit Member Modal */}
        {editingMember && (
          <div className={styles.modalOverlay}>
            <Card title={`Edit Member - ${editingMember.name}`} className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Role</label>
                <select
                  className={styles.formSelect}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'member' })}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                <Button variant="secondary" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button leftIcon={<Save size={16} />} onClick={handleSubmit}>
                  Save Changes
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Render Profile View/Edit
  return (
    <div className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar} style={{ backgroundColor: getRoleColor(user!.role) }}>
          {getInitials(user!.name)}
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{user!.name}</h1>
          <p className={styles.profileEmail}>{user!.email}</p>
          <span className={styles.profileRole} style={{ backgroundColor: getRoleColor(user!.role) }}>
            {user!.role === 'admin' ? 'Admin' : 'Member'}
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
            <p className={styles.formValue}>{user!.name}</p>
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
            <p className={styles.formValue}>{user!.email}</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Role</label>
          <p className={styles.formValue}>
            <span className={styles.roleBadge} style={{ backgroundColor: getRoleColor(user!.role) }}>
              {user!.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end' }}>
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button leftIcon={<Save size={16} />} onClick={handleSubmit}>
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
    </div>
  );
};

export default Profile;
