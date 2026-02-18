import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function ManageClubs() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: '',
    category: '',
    description: '',
    contactEmail: ''
  });
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const res = await api.get('/admin/organizers');
      setOrganizers(res.data);
    } catch (err) {
      console.error('Failed to load organizers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newOrg.name || !newOrg.category || !newOrg.contactEmail) {
      toast.error('Name, category and contact email are required');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/admin/organizers', newOrg);
      setCredentials(res.data.credentials);
      toast.success('Organizer created!');
      setNewOrg({ name: '', category: '', description: '', contactEmail: '' });
      fetchOrganizers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create organizer');
    } finally {
      setCreating(false);
    }
  };

  const handleDisable = async (orgId) => {
    if (!window.confirm('Are you sure you want to disable this organizer?')) return;
    try {
      await api.put('/admin/organizers/' + orgId + '/disable');
      toast.success('Organizer disabled');
      fetchOrganizers();
    } catch (err) {
      toast.error('Failed to disable');
    }
  };

  const handleEnable = async (orgId) => {
    try {
      await api.put('/admin/organizers/' + orgId + '/enable');
      toast.success('Organizer enabled');
      fetchOrganizers();
    } catch (err) {
      toast.error('Failed to enable');
    }
  };

  const handleDelete = async (orgId) => {
    if (!window.confirm('Permanently delete this organizer? This cannot be undone.')) return;
    try {
      await api.delete('/admin/organizers/' + orgId);
      toast.success('Organizer deleted');
      fetchOrganizers();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleResetPassword = async (orgId) => {
    if (!window.confirm('Reset password for this organizer?')) return;
    try {
      const res = await api.put('/admin/organizers/' + orgId + '/reset-password');
      setCredentials(res.data.credentials);
      toast.success('Password reset');
    } catch (err) {
      toast.error('Failed to reset password');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Clubs / Organizers</h1>
        <button onClick={() => { setShowCreate(!showCreate); setCredentials(null); }} className="btn-primary">
          {showCreate ? 'Cancel' : '+ Add Organizer'}
        </button>
      </div>

      {/* Credentials display */}
      {credentials && (
        <div className="card mb-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">Generated Credentials</h3>
          <p className="text-sm">Share these credentials with the organizer:</p>
          <div className="bg-white rounded p-3 mt-2 font-mono text-sm">
            <p>Email: <strong>{credentials.email}</strong></p>
            <p>Password: <strong>{credentials.password}</strong></p>
          </div>
          <button onClick={() => {
            navigator.clipboard.writeText('Email: ' + credentials.email + '\nPassword: ' + credentials.password);
            toast.success('Copied to clipboard');
          }} className="btn-secondary text-sm mt-2">
            Copy Credentials
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Organizer</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Organization Name *</label>
              <input type="text" className="input-field" value={newOrg.name}
                onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Category *</label>
              <input type="text" className="input-field" placeholder="e.g. Technical, Cultural, Sports"
                value={newOrg.category} onChange={(e) => setNewOrg({ ...newOrg, category: e.target.value })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input-field" rows={3} value={newOrg.description}
                onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Contact Email *</label>
              <input type="email" className="input-field" value={newOrg.contactEmail}
                onChange={(e) => setNewOrg({ ...newOrg, contactEmail: e.target.value })} />
            </div>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? 'Creating...' : 'Create Organizer'}
            </button>
          </div>
        </form>
      )}

      {/* Organizers List */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">All Organizers ({organizers.length})</h2>

        {organizers.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No organizers created yet.</p>
        ) : (
          <div className="space-y-3">
            {organizers.map(org => (
              <div key={org._id} className={`border rounded p-4 ${!org.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{org.name}</h3>
                    <p className="text-sm text-gray-500">{org.category}</p>
                    <p className="text-xs text-gray-400 mt-1">Login: {org.userId?.email || 'N/A'}</p>
                    {org.description && <p className="text-sm text-gray-600 mt-1">{org.description}</p>}
                    <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${
                      org.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {org.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {org.isActive ? (
                      <button onClick={() => handleDisable(org._id)} className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                        Disable
                      </button>
                    ) : (
                      <button onClick={() => handleEnable(org._id)} className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                        Enable
                      </button>
                    )}
                    <button onClick={() => handleResetPassword(org._id)} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                      Reset Password
                    </button>
                    <button onClick={() => handleDelete(org._id)} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageClubs;
