import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [evtRes, analyticsRes] = await Promise.all([
        api.get('/organizers/my-events'),
        api.get('/organizers/analytics')
      ]);
      setEvents(evtRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-700',
      ongoing: 'bg-blue-100 text-blue-700',
      completed: 'bg-purple-100 text-purple-700',
      closed: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const nextSlide = () => {
    if (carouselIdx < events.length - 3) setCarouselIdx(carouselIdx + 1);
  };

  const prevSlide = () => {
    if (carouselIdx > 0) setCarouselIdx(carouselIdx - 1);
  };

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

  const visibleEvents = events.slice(carouselIdx, carouselIdx + 3);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
          <p className="text-gray-500">{user?.organizerName || 'Welcome'}</p>
        </div>
        <Link to="/organizer/create-event" className="btn-primary">+ Create Event</Link>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-bold text-indigo-600">{analytics.totalEvents}</p>
            <p className="text-sm text-gray-500">Total Events</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">{analytics.totalRegistrations}</p>
            <p className="text-sm text-gray-500">Total Registrations</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-purple-600">{analytics.completedEvents}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-amber-600">₹{analytics.totalRevenue}</p>
            <p className="text-sm text-gray-500">Total Revenue</p>
          </div>
        </div>
      )}

      {/* Events Carousel */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">My Events</h2>
        {events.length === 0 ? (
          <div className="card text-center text-gray-400">
            No events created yet.
            <Link to="/organizer/create-event" className="text-indigo-600 hover:underline ml-1">Create one now</Link>
          </div>
        ) : (
          <div>
            <div className="flex gap-2 mb-2">
              <button onClick={prevSlide} disabled={carouselIdx === 0}
                className="btn-secondary text-sm disabled:opacity-30">&larr;</button>
              <button onClick={nextSlide} disabled={carouselIdx >= events.length - 3}
                className="btn-secondary text-sm disabled:opacity-30">&rarr;</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visibleEvents.map(evt => (
                <Link key={evt._id} to={'/organizer/events/' + evt._id}
                  className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{evt.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor(evt.status)}`}>
                      {evt.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Type: {evt.eventType}</p>
                  <p className="text-xs text-gray-500">Registrations: {evt.registrationCount || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(evt.startDate).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full event list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">All Events</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Name</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Registrations</th>
                <th className="pb-2">Start Date</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(evt => (
                <tr key={evt._id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{evt.name}</td>
                  <td className="py-2">{evt.eventType}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusColor(evt.status)}`}>
                      {evt.status}
                    </span>
                  </td>
                  <td className="py-2">{evt.registrationCount || 0}</td>
                  <td className="py-2">{new Date(evt.startDate).toLocaleDateString()}</td>
                  <td className="py-2">
                    <Link to={'/organizer/events/' + evt._id} className="text-indigo-600 hover:underline text-xs">
                      View/Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OrganizerDashboard;
