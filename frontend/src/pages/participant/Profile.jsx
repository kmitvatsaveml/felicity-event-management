import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const INTEREST_OPTIONS = [
  'Technology', 'Music', 'Dance', 'Art', 'Gaming',
  'Literature', 'Photography', 'Coding', 'Robotics',
  'Dramatics', 'Sports', 'Design', 'Quiz', 'Finance'
];

function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    collegeName: '',
    interests: []
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmNew: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    // load full profile from server
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setForm({
        firstName: res.data.firstName || '',
        lastName: res.data.lastName || '',
        contactNumber: res.data.contactNumber || '',
        collegeName: res.data.collegeName || '',
        interests: res.data.interests || []
      });
    } catch (err) {
      console.error('Failed to load profile');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleInterest = (interest) => {
    const updated = form.interests.includes(interest)
      ? form.interests.filter(i => i !== interest)
      : [...form.interests, interest];
    setForm({ ...form, interests: updated });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      updateUser({
        firstName: form.firstName,
        lastName: form.lastName
      });
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNew) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPw(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmNew: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {/* Non-editable fields */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-3">Account Info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Email</span>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <span className="text-gray-500">Participant Type</span>
            <p className="font-medium">{user?.participantType === 'iiit' ? 'IIIT Student' : 'Non-IIIT'}</p>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <form onSubmit={handleSave} className="card mb-6">
        <h2 className="text-lg font-semibold mb-3">Edit Profile</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input type="text" name="firstName" className="input-field" value={form.firstName} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" name="lastName" className="input-field" value={form.lastName} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="label">Contact Number</label>
            <input type="text" name="contactNumber" className="input-field" value={form.contactNumber} onChange={handleChange} />
          </div>
          <div>
            <label className="label">College / Organization</label>
            <input type="text" name="collegeName" className="input-field" value={form.collegeName} onChange={handleChange} />
          </div>

          <div>
            <label className="label">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    form.interests.includes(interest)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password change */}
      <form onSubmit={handlePasswordChange} className="card">
        <h2 className="text-lg font-semibold mb-3">Change Password</h2>
        <div className="space-y-3">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input-field" value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input-field" value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input-field" value={passwords.confirmNew}
              onChange={(e) => setPasswords({ ...passwords, confirmNew: e.target.value })} />
          </div>
          <button type="submit" disabled={changingPw} className="btn-primary">
            {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Profile;
