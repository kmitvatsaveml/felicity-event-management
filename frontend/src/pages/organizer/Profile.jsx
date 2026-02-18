import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function OrganizerProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    contactEmail: '',
    contactNumber: '',
    discordWebhook: ''
  });
  const [saving, setSaving] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [requestingReset, setRequestingReset] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setForm({
        name: res.data.organizerName || '',
        category: res.data.category || '',
        description: res.data.description || '',
        contactEmail: res.data.contactEmail || '',
        contactNumber: res.data.contactNumber || '',
        discordWebhook: res.data.discordWebhook || ''
      });
    } catch (err) {
      console.error('Failed to load profile');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/organizers/profile', form);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    if (!resetReason.trim()) {
      toast.error('Please provide a reason for the reset request');
      return;
    }
    setRequestingReset(true);
    try {
      await api.post('/admin/password-reset-request', { reason: resetReason.trim() });
      toast.success('Password reset request submitted to admin');
      setResetReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setRequestingReset(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Organizer Profile</h1>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-3">Account Info</h2>
        <p className="text-sm text-gray-500">Login Email (non-editable)</p>
        <p className="font-medium mb-2">{user?.email}</p>
      </div>

      <form onSubmit={handleSave} className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Organization Name</label>
            <input type="text" name="name" className="input-field" value={form.name} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Category</label>
            <input type="text" name="category" className="input-field" placeholder="e.g. Technical, Cultural, Sports" value={form.category} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input-field" rows={4} value={form.description} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Email</label>
              <input type="email" name="contactEmail" className="input-field" value={form.contactEmail} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input type="text" name="contactNumber" className="input-field" value={form.contactNumber} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="label">Discord Webhook URL</label>
            <input type="url" name="discordWebhook" className="input-field" placeholder="https://discord.com/api/webhooks/..." value={form.discordWebhook} onChange={handleChange} />
            <p className="text-xs text-gray-400 mt-1">New events will be auto-posted to this Discord channel when published.</p>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password Reset Request */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-3">Request Password Reset</h2>
        <p className="text-sm text-gray-500 mb-3">
          Submit a request to the admin to reset your password. You will receive a new password once approved.
        </p>
        <div className="space-y-3">
          <textarea
            value={resetReason}
            onChange={(e) => setResetReason(e.target.value)}
            placeholder="Why do you need a password reset? (e.g., forgot password, security concern)"
            rows={2}
            className="input-field"
          />
          <button
            onClick={handlePasswordResetRequest}
            disabled={requestingReset}
            className="btn-secondary"
          >
            {requestingReset ? 'Submitting...' : 'Submit Reset Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrganizerProfile;
