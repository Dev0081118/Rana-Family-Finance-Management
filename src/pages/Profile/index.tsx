import React, { useState } from 'react';
import { Save } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import styles from './Profile.module.css';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Profile saved:', profile);
  };

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar}>JD</div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{profile.name}</h1>
          <p className={styles.profileEmail}>{profile.email}</p>
          <span className={styles.profileRole}>{profile.role}</span>
        </div>
      </div>

      <Card title="Personal Information" className={styles.profileSection}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Full Name</label>
          <input
            type="text"
            className={styles.formInput}
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Enter your full name"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Email Address</label>
          <input
            type="email"
            className={styles.formInput}
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="Enter your email"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Role</label>
          <input
            type="text"
            className={styles.formInput}
            value={profile.role}
            disabled
            placeholder="Your role"
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setProfile({ name: 'John Doe', email: 'john@example.com', role: 'Admin' })}>
            Cancel
          </Button>
          <Button leftIcon={<Save size={16} />} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </Card>

      <Card title="Family Members" className={styles.profileSection}>
        <div className={styles.memberGrid}>
          <div className={styles.memberCard}>
            <div className={styles.memberAvatar} style={{ backgroundColor: '#0ea5e9' }}>JD</div>
            <h4 className={styles.memberName}>John Doe</h4>
            <p className={styles.memberValue}>Admin</p>
          </div>
          <div className={styles.memberCard}>
            <div className={styles.memberAvatar} style={{ backgroundColor: '#10b981' }}>JS</div>
            <h4 className={styles.memberName}>Jane Smith</h4>
            <p className={styles.memberValue}>Member</p>
          </div>
          <div className={styles.memberCard}>
            <div className={styles.memberAvatar} style={{ backgroundColor: '#f59e0b' }}>BJ</div>
            <h4 className={styles.memberName}>Bob Johnson</h4>
            <p className={styles.memberValue}>Member</p>
          </div>
          <div className={styles.memberCard}>
            <div className={styles.memberAvatar} style={{ backgroundColor: '#ef4444' }}>AB</div>
            <h4 className={styles.memberName}>Alice Brown</h4>
            <p className={styles.memberValue}>Member</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;