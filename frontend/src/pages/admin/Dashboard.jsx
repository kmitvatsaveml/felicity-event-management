import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
            <p className="text-sm text-gray-500">Participants</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">{stats.totalOrganizers}</p>
            <p className="text-sm text-gray-500">Organizers</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.totalEvents}</p>
            <p className="text-sm text-gray-500">Total Events</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-amber-600">{stats.activeEvents}</p>
            <p className="text-sm text-gray-500">Active Events</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/manage-clubs" className="card hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-semibold text-indigo-700 mb-2">Manage Clubs / Organizers</h2>
          <p className="text-sm text-gray-500">Create, disable, or remove organizer accounts.</p>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
