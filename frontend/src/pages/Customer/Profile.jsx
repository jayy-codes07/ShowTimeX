import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import { useAuth } from '../../context/AuthContext';
import { validateForm } from '../../utils/validators';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // profile, password
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const validationRules = {
      name: { required: true, type: 'name', label: 'Name' },
      email: { required: true, type: 'email', label: 'Email' },
      phone: { required: true, type: 'phone', label: 'Phone' },
    };

    const validation = validateForm(profileData, validationRules);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    const result = await updateProfile(profileData);
    setLoading(false);

    if (result.success) {
      toast.success('Profile updated successfully!');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const validationRules = {
      currentPassword: { required: true, label: 'Current Password' },
      newPassword: { required: true, type: 'password', label: 'New Password' },
      confirmPassword: { required: true, match: 'newPassword', label: 'Confirm Password' },
    };

    const validation = validateForm(passwordData, validationRules);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      // Call password update API
      const result = await updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (result.success) {
        toast.success('Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark py-8">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'profile'
                ? 'border-primary text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'password'
                ? 'border-primary text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'profile' ? (
            <div className="bg-dark-card rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Update Profile</h2>
              
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <Input
                  label="Full Name"
                  name="name"
                  type="text"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  placeholder="John Doe"
                  error={errors.name}
                  icon={<User className="w-5 h-5" />}
                  required
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  placeholder="you@example.com"
                  error={errors.email}
                  icon={<Mail className="w-5 h-5" />}
                  required
                />

                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  placeholder="9876543210"
                  error={errors.phone}
                  icon={<Phone className="w-5 h-5" />}
                  required
                />

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setProfileData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                      });
                      setErrors({});
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    icon={<Save className="w-5 h-5" />}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-dark-card rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  error={errors.currentPassword}
                  icon={<Lock className="w-5 h-5" />}
                  required
                />

                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  error={errors.newPassword}
                  icon={<Lock className="w-5 h-5" />}
                  required
                />

                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Re-enter new password"
                  error={errors.confirmPassword}
                  icon={<Lock className="w-5 h-5" />}
                  required
                />

                <div className="bg-dark-lighter rounded-lg p-4 text-sm text-gray-400">
                  <p className="font-semibold text-white mb-2">Password Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Minimum 8 characters</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one lowercase letter</li>
                    <li>At least one number</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                      setErrors({});
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    icon={<Lock className="w-5 h-5" />}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          )}
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-dark-card rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Account Type</p>
              <p className="text-white font-semibold capitalize">{user?.role || 'Customer'}</p>
            </div>
            <div>
              <p className="text-gray-500">Member Since</p>
              <p className="text-white font-semibold">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;