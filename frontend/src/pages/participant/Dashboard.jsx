import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

function Dashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      const res = await api.get('/events/my/registrations');
      setRegistrations(res.data);
    } catch (err) {
      console.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();

  const upcoming = registrations.filter(r => {
    const evt = r.eventId;
    if (!evt) return false;
    return new Date(evt.startDate) > now && r.status === 'registered';
  });

  const normalHistory = registrations.filter(r => r.eventId && r.eventId.eventType === 'normal');
  const merchHistory = registrations.filter(r => r.eventId && r.eventId.eventType === 'merchandise');
  const completed = registrations.filter(r => {
    const evt = r.eventId;
    return evt && (new Date(evt.endDate) < now || evt.status === 'completed');
  });
  const cancelledOrRejected = registrations.filter(r => r.status === 'cancelled' || r.status === 'rejected');

  const tabs = [
    { key: 'upcoming', label: 'Upcoming', data: upcoming },
    { key: 'normal', label: 'Normal', data: normalHistory },
    { key: 'merchandise', label: 'Merchandise', data: merchHistory },
    { key: 'completed', label: 'Completed', data: completed },
    { key: 'cancelled', label: 'Cancelled/Rejected', data: cancelledOrRejected }
  ];

  const currentData = tabs.find(t => t.key === activeTab)?.data || [];

  if (loading) return <div className="text-center py-10">Loading your events...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">My Events</h1>
      <p className="text-gray-500 mb-6">Welcome back, {user?.firstName}!</p>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} ({tab.data.length})
          </button>
        ))}
      </div>

      {/* Event list */}
      {currentData.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No events in this category.
          {activeTab === 'upcoming' && (
            <div className="mt-2">
              <Link to="/events" className="text-indigo-600 hover:underline">Browse events</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {currentData.map(reg => {
            const evt = reg.eventId;
            if (!evt) return null;
            const orgName = evt.organizerId?.name || 'Unknown';
            return (
              <div key={reg._id} className="card flex items-center justify-between">
                <div>
                  <Link to={`/events/${evt._id}`} className="font-semibold text-indigo-700 hover:underline">
                    {evt.name}
                  </Link>
                  <div className="text-sm text-gray-500 mt-1">
                    <span className="mr-3">Type: {evt.eventType}</span>
                    <span className="mr-3">Organizer: {orgName}</span>
                    <span>Status: <span className={`font-medium ${reg.status === 'registered' ? 'text-green-600' : reg.status === 'cancelled' ? 'text-red-500' : 'text-gray-600'}`}>{reg.status}</span></span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(evt.startDate).toLocaleDateString()} - {new Date(evt.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  {reg.ticketId && (
                    <Link to={`/ticket/${reg.ticketId}`} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono hover:bg-indigo-100 transition-colors">
                      {reg.ticketId}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
