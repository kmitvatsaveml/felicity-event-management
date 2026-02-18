import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

function OrganizerView() {
  const { id } = useParams();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizerData();
  }, [id]);

  const fetchOrganizerData = async () => {
    try {
      const orgRes = await api.get('/users/organizers/' + id);
      setOrganizer(orgRes.data);

      // fetch events by this organizer that are published
      const evtRes = await api.get('/events', { params: { search: orgRes.data.name } });
      setEvents(evtRes.data.events || []);
    } catch (err) {
      console.error('Failed to load organizer');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!organizer) return <div className="text-center py-10 text-red-500">Organizer not found</div>;

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.startDate) > now);
  const past = events.filter(e => new Date(e.endDate) < now);

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/clubs" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Clubs</Link>

      <div className="card mb-6">
        <h1 className="text-2xl font-bold">{organizer.name}</h1>
        <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{organizer.category}</span>
        <p className="text-gray-700 mt-3">{organizer.description || 'No description provided.'}</p>
        {organizer.contactEmail && (
          <p className="text-sm text-gray-500 mt-2">Contact: {organizer.contactEmail}</p>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Upcoming Events</h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-400 text-sm">No upcoming events.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map(evt => (
              <Link key={evt._id} to={'/events/' + evt._id} className="card block hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-indigo-700">{evt.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {evt.eventType} | {new Date(evt.startDate).toLocaleDateString()} | {evt.registrationFee > 0 ? '₹' + evt.registrationFee : 'Free'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Past Events</h2>
        {past.length === 0 ? (
          <p className="text-gray-400 text-sm">No past events.</p>
        ) : (
          <div className="space-y-3">
            {past.map(evt => (
              <div key={evt._id} className="card opacity-75">
                <h3 className="font-semibold text-gray-600">{evt.name}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {evt.eventType} | {new Date(evt.startDate).toLocaleDateString()} - {new Date(evt.endDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganizerView;
