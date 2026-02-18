import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

function BrowseEvents() {
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    eligibility: 'all',
    dateFrom: '',
    dateTo: '',
    followedOnly: false
  });

  useEffect(() => {
    fetchTrending();
    fetchEvents();
  }, []);

  const fetchTrending = async () => {
    try {
      const res = await api.get('/events', { params: { trending: 'true' } });
      setTrending(res.data.events || []);
    } catch (err) {
      console.error('Failed to load trending events');
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.eligibility !== 'all') params.eligibility = filters.eligibility;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.followedOnly) params.followedOnly = 'true';

      const res = await api.get('/events', { params });
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
  };

  // re-fetch when filters change
  useEffect(() => {
    fetchEvents();
  }, [filters]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Browse Events</h1>

      {/* Trending Section */}
      {trending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Trending Now</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {trending.map(evt => (
              <Link key={evt._id} to={`/events/${evt._id}`}
                className="min-w-[220px] card hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-indigo-700">{evt.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{evt.organizerId?.name}</p>
                <p className="text-xs text-gray-400 mt-1">{evt.eventType} | {new Date(evt.startDate).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Search events or organizers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Event Type</label>
            <select className="input-field" value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}>
              <option value="all">All Types</option>
              <option value="normal">Normal</option>
              <option value="merchandise">Merchandise</option>
            </select>
          </div>
          <div>
            <label className="label">Eligibility</label>
            <select className="input-field" value={filters.eligibility}
              onChange={(e) => handleFilterChange('eligibility', e.target.value)}>
              <option value="all">All</option>
              <option value="iiit">IIIT Only</option>
              <option value="non-iiit">Non-IIIT</option>
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input type="date" className="input-field" value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)} />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" className="input-field" value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)} />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <input type="checkbox" id="followedOnly" checked={filters.followedOnly}
              onChange={(e) => handleFilterChange('followedOnly', e.target.checked)} />
            <label htmlFor="followedOnly" className="text-sm">Followed Clubs Only</label>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No events found matching your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(evt => (
            <Link key={evt._id} to={`/events/${evt._id}`} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-indigo-700">{evt.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  evt.eventType === 'normal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {evt.eventType}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{evt.description}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Organizer: {evt.organizerId?.name || 'Unknown'}</p>
                <p>Date: {new Date(evt.startDate).toLocaleDateString()} - {new Date(evt.endDate).toLocaleDateString()}</p>
                <p>Fee: {evt.registrationFee > 0 ? '₹' + evt.registrationFee : 'Free'}</p>
                {evt.tags && evt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {evt.tags.map((tag, i) => (
                      <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default BrowseEvents;
