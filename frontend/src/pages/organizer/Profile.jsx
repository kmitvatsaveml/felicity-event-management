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
    </div>
  );
}

export default OrganizerProfile;
