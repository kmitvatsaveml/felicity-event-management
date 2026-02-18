import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function PasswordResetRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await api.get('/admin/password-reset-requests');
      setRequests(res.data);
    } catch (err) {
      toast.error('Failed to load reset requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reqId) => {
    const comment = prompt('Add a comment (optional):') || '';
    try {
      const res = await api.put('/admin/password-reset-requests/' + reqId + '/approve', { comment });
      toast.success('Request approved! New password: ' + res.data.credentials.password);
      alert('New credentials:\nEmail: ' + res.data.credentials.email + '\nPassword: ' + res.data.credentials.password);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (reqId) => {
    const comment = prompt('Reason for rejection:');
    if (!comment) return;
    try {
      await api.put('/admin/password-reset-requests/' + reqId + '/reject', { comment });
      toast.success('Request rejected');
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  const filtered = requests.filter(r => filter === 'all' ? true : r.status === filter);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <Link to="/admin/dashboard" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Dashboard</Link>
      <h1 className="text-2xl font-bold mb-4">Password Reset Requests</h1>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {f} ({requests.filter(r => f === 'all' ? true : r.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-gray-400 py-8">No requests found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req._id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{req.organizerId?.name || 'Unknown Club'}</p>
                  <p className="text-sm text-gray-500">{req.userId?.email}</p>
                  <p className="text-sm mt-1"><strong>Reason:</strong> {req.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted: {new Date(req.createdAt).toLocaleString()}
                  </p>
                  {req.adminComment && (
                    <p className="text-xs text-gray-500 mt-1">Admin note: {req.adminComment}</p>
                  )}
                  {req.reviewedAt && (
                    <p className="text-xs text-gray-400">Reviewed: {new Date(req.reviewedAt).toLocaleString()}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  req.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>{req.status}</span>
              </div>

              {req.status === 'pending' && (
                <div className="mt-3 border-t pt-3 flex gap-2">
                  <button onClick={() => handleApprove(req._id)} className="btn-primary text-sm">
                    Approve & Generate Password
                  </button>
                  <button onClick={() => handleReject(req._id)} className="btn-danger text-sm">
                    Reject
                  </button>
                </div>
              )}

              {req.status === 'approved' && req.newPassword && (
                <div className="mt-3 border-t pt-3 bg-green-50 p-2 rounded">
                  <p className="text-sm text-green-700">Generated Password: <strong>{req.newPassword}</strong></p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PasswordResetRequests;
