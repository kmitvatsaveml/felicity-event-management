import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    try {
      const res = await api.get('/organizers/events/' + id);
      setEvent(res.data.event);
      setRegistrations(res.data.registrations);
      setAnalytics(res.data.analytics);
    } catch (err) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put('/organizers/events/' + id, { status: newStatus });
      toast.success('Status updated to ' + newStatus);
      loadEventData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/organizers/events/' + id + '/export', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', event.name + '_registrations.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Export failed');
    }
  };

  // filter registrations
  const filteredRegs = registrations.filter(reg => {
    const user = reg.userId;
    if (!user) return false;
    const name = (user.firstName + ' ' + user.lastName).toLowerCase();
    const email = user.email.toLowerCase();
    const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="text-center py-10">Loading event...</div>;
  if (!event) return <div className="text-center py-10 text-red-500">Event not found</div>;

  const statusColor = {
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-700',
    ongoing: 'bg-blue-100 text-blue-700',
    completed: 'bg-purple-100 text-purple-700',
    closed: 'bg-red-100 text-red-700'
  };

  return (
    <div>
      <Link to="/organizer/dashboard" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Dashboard</Link>

      {/* Event Overview */}
      <div className="card mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <span className={`text-xs px-3 py-1 rounded-full ${statusColor[event.status] || ''}`}>
              {event.status}
            </span>
          </div>
          <div className="flex gap-2">
            {event.status === 'draft' && (
              <>
                <Link to={`/organizer/events/${id}/edit`} className="btn-primary text-sm">Edit Event</Link>
                <button onClick={() => handleStatusChange('published')} className="btn-secondary text-sm">Publish Event</button>
              </>
            )}
            {event.status === 'published' && (
              <>
                <Link to={`/organizer/events/${id}/edit`} className="btn-secondary text-sm">Edit Event</Link>
                <button onClick={() => handleStatusChange('ongoing')} className="btn-primary text-sm">Mark Ongoing</button>
                <button onClick={() => handleStatusChange('closed')} className="btn-danger text-sm">Close Registrations</button>
              </>
            )}
            {event.status === 'ongoing' && (
              <>
                <Link to={`/organizer/events/${id}/edit`} className="btn-secondary text-sm">Edit Event</Link>
                <button onClick={() => handleStatusChange('completed')} className="btn-primary text-sm">Mark Completed</button>
              </>
            )}
            {event.status === 'completed' && (
              <span className="text-sm text-gray-500">Event completed - no changes allowed</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4">
          <div>
            <span className="text-gray-500">Type:</span>
            <p className="font-medium">{event.eventType}</p>
          </div>
          <div>
            <span className="text-gray-500">Eligibility:</span>
            <p className="font-medium">{event.eligibility}</p>
          </div>
          <div>
            <span className="text-gray-500">Fee:</span>
            <p className="font-medium">{event.registrationFee > 0 ? '₹' + event.registrationFee : 'Free'}</p>
          </div>
          <div>
            <span className="text-gray-500">Start:</span>
            <p className="font-medium">{new Date(event.startDate).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500">End:</span>
            <p className="font-medium">{new Date(event.endDate).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Deadline:</span>
            <p className="font-medium">{new Date(event.registrationDeadline).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Action Links */}
      <div className="flex gap-3 mb-6">
        {event.eventType === 'merchandise' && (
          <Link to={'/organizer/events/' + id + '/payments'} className="card flex-1 text-center hover:bg-indigo-50 transition-colors">
            <p className="text-lg font-bold text-indigo-600">💳</p>
            <p className="text-sm font-medium">Payment Approvals</p>
          </Link>
        )}
        <Link to={'/organizer/events/' + id + '/scanner'} className="card flex-1 text-center hover:bg-green-50 transition-colors">
          <p className="text-lg font-bold text-green-600">📱</p>
          <p className="text-sm font-medium">QR Scanner</p>
        </Link>
        <Link to={'/events/' + id + '/forum'} className="card flex-1 text-center hover:bg-purple-50 transition-colors">
          <p className="text-lg font-bold text-purple-600">💬</p>
          <p className="text-sm font-medium">Discussion Forum</p>
        </Link>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-indigo-600">{analytics.totalRegistrations}</p>
            <p className="text-xs text-gray-500">Registrations</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{analytics.attended}</p>
            <p className="text-xs text-gray-500">Attended</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-600">{analytics.cancelled}</p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-amber-600">₹{analytics.revenue}</p>
            <p className="text-xs text-gray-500">Revenue</p>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Participants ({filteredRegs.length})</h2>
          <button onClick={handleExport} className="btn-secondary text-sm">Export CSV</button>
        </div>

        <div className="flex gap-3 mb-4">
          <input type="text" className="input-field flex-1" placeholder="Search by name or email..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="input-field w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="registered">Registered</option>
            <option value="attended">Attended</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {filteredRegs.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No participants found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Registered</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Ticket ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map(reg => {
                  const u = reg.userId;
                  return (
                    <tr key={reg._id} className="border-b last:border-0">
                      <td className="py-2">{u ? u.firstName + ' ' + u.lastName : 'N/A'}</td>
                      <td className="py-2 text-gray-600">{u ? u.email : 'N/A'}</td>
                      <td className="py-2 text-gray-500">{new Date(reg.registeredAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          reg.status === 'registered' ? 'bg-green-100 text-green-700' :
                          reg.status === 'attended' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>{reg.status}</span>
                      </td>
                      <td className="py-2 font-mono text-xs">{reg.ticketId || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetail;
