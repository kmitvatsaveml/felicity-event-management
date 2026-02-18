import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

function TicketDetail() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      const res = await api.get('/tickets/' + ticketId);
      setTicket(res.data);
    } catch (err) {
      console.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading ticket...</div>;
  if (!ticket) return <div className="text-center py-10 text-red-500">Ticket not found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/dashboard" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Dashboard</Link>

      <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-800 mb-2">🎫 Event Ticket</h1>
          <p className="text-sm text-gray-600">Please present this ticket at the event venue</p>
        </div>

        {/* Event Information */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-lg mb-3 text-gray-800">📅 Event Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Event:</span>
              <span className="font-medium">{ticket.eventId?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="capitalize">{ticket.eventId?.eventType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Organizer:</span>
              <span className="font-medium">{ticket.eventId?.organizerId?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {new Date(ticket.eventId?.startDate).toLocaleDateString()} - {new Date(ticket.eventId?.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Venue:</span>
              <span className="font-medium">{ticket.eventId?.venue || 'Main Campus'}</span>
            </div>
          </div>
        </div>

        {/* Participant Information */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-lg mb-3 text-gray-800">👤 Participant Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{ticket.userId?.firstName} {ticket.userId?.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{ticket.userId?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">College:</span>
              <span className="font-medium">{ticket.userId?.collegeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Contact:</span>
              <span className="font-medium">{ticket.userId?.contactNumber}</span>
            </div>
          </div>
        </div>

        {/* Registration Information */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h2 className="font-semibold text-lg mb-3 text-gray-800">📋 Registration Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket ID:</span>
              <span className="font-mono font-bold text-indigo-600">{ticket.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Registered On:</span>
              <span className="font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium capitalize ${
                ticket.status === 'registered' ? 'text-green-600' : 
                ticket.status === 'attended' ? 'text-blue-600' : 
                'text-gray-600'
              }`}>{ticket.status}</span>
            </div>
            {ticket.eventId?.registrationFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Fee Paid:</span>
                <span className="font-medium">₹{ticket.eventId?.registrationFee}</span>
              </div>
            )}
          </div>
        </div>

        {/* Custom Form Data */}
        {ticket.formData && Object.keys(ticket.formData).length > 0 && (
          <div className="bg-white rounded-lg p-4 mb-4">
            <h2 className="font-semibold text-lg mb-3 text-gray-800">📝 Additional Information</h2>
            <div className="space-y-2 text-sm">
              {Object.entries(ticket.formData).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="bg-white rounded-lg p-4 text-center">
          <h2 className="font-semibold text-lg mb-3 text-gray-800">📱 QR Code</h2>
          <div className="inline-block p-4 bg-gray-50 rounded-lg">
            {ticket.qrCode ? (
              <img src={ticket.qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
            ) : (
              <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                QR Code Loading...
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Scan this code at the event entrance</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => window.print()}
            className="btn-primary flex-1"
          >
            🖨️ Print Ticket
          </button>
          <Link to="/dashboard" className="btn-secondary flex-1 text-center">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TicketDetail;
