import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formResponses, setFormResponses] = useState({});
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get('/events/' + id);
      setEvent(res.data.event);
      setIsRegistered(res.data.isRegistered);
      setRegistration(res.data.registration);

      if (res.data.registration?.ticketId) {
        try {
          const ticketRes = await api.get('/tickets/' + res.data.registration.ticketId);
          setTicket(ticketRes.data);
        } catch (e) {
          // ticket fetch might fail, that's okay
        }
      }
    } catch (err) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (fieldLabel, value) => {
    setFormResponses({ ...formResponses, [fieldLabel]: value });
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const body = { formResponses };
      if (event.eventType === 'merchandise') {
        if (!selectedVariant) {
          toast.error('Please select a variant');
          setRegistering(false);
          return;
        }
        body.variantId = selectedVariant;
        body.quantity = quantity;
      }

      const res = await api.post('/events/' + id + '/register', body);
      setIsRegistered(true);
      setRegistration(res.data.registration);
      setTicket({ ticketId: res.data.ticket.ticketId, qrCode: res.data.ticket.qrCode });
      toast.success('Registration successful!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading event...</div>;
  if (!event) return <div className="text-center py-10 text-red-500">Event not found</div>;

  const deadlinePassed = new Date() > new Date(event.registrationDeadline);
  const limitReached = event.registrationLimit > 0 && event.registrationCount >= event.registrationLimit;
  const canRegister = !isRegistered && !deadlinePassed && !limitReached &&
    (event.status === 'published' || event.status === 'ongoing');

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/events" className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Events</Link>

      <div className="card mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            <p className="text-sm text-gray-500 mt-1">by {event.organizerId?.name || 'Unknown'}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            event.eventType === 'normal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {event.eventType}
          </span>
        </div>

        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{event.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-500">Start Date:</span>
            <p className="font-medium">{new Date(event.startDate).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500">End Date:</span>
            <p className="font-medium">{new Date(event.endDate).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Registration Deadline:</span>
            <p className={`font-medium ${deadlinePassed ? 'text-red-500' : ''}`}>
              {new Date(event.registrationDeadline).toLocaleString()}
              {deadlinePassed && ' (Closed)'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Eligibility:</span>
            <p className="font-medium">{event.eligibility === 'all' ? 'Open to All' : event.eligibility.toUpperCase()}</p>
          </div>
          <div>
            <span className="text-gray-500">Fee:</span>
            <p className="font-medium">{event.registrationFee > 0 ? '₹' + event.registrationFee : 'Free'}</p>
          </div>
          <div>
            <span className="text-gray-500">Registrations:</span>
            <p className="font-medium">
              {event.registrationCount}{event.registrationLimit > 0 ? ' / ' + event.registrationLimit : ''}
              {limitReached && <span className="text-red-500 ml-1">(Full)</span>}
            </p>
          </div>
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.tags.map((tag, i) => (
              <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Forum & Feedback Links */}
      <div className="flex gap-3 mb-6">
        <Link to={'/events/' + event._id + '/forum'} className="card flex-1 text-center hover:bg-purple-50 transition-colors">
          <p className="text-lg">💬</p>
          <p className="text-sm font-medium">Discussion Forum</p>
        </Link>
        {isRegistered && (
          <Link to={'/events/' + event._id + '/feedback'} className="card flex-1 text-center hover:bg-amber-50 transition-colors">
            <p className="text-lg">⭐</p>
            <p className="text-sm font-medium">Leave Feedback</p>
          </Link>
        )}
      </div>

      {/* Registration Form */}
      {canRegister && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">Register for this Event</h2>

          {/* Custom form fields for normal events */}
          {event.eventType === 'normal' && event.customForm && event.customForm.length > 0 && (
            <div className="space-y-3 mb-4">
              {event.customForm.sort((a, b) => a.order - b.order).map(field => (
                <div key={field._id}>
                  <label className="label">{field.label} {field.required && '*'}</label>
                  {field.fieldType === 'text' && (
                    <input type="text" className="input-field"
                      onChange={(e) => handleFormChange(field.label, e.target.value)} />
                  )}
                  {field.fieldType === 'textarea' && (
                    <textarea className="input-field" rows={3}
                      onChange={(e) => handleFormChange(field.label, e.target.value)} />
                  )}
                  {field.fieldType === 'number' && (
                    <input type="number" className="input-field"
                      onChange={(e) => handleFormChange(field.label, e.target.value)} />
                  )}
                  {field.fieldType === 'email' && (
                    <input type="email" className="input-field"
                      onChange={(e) => handleFormChange(field.label, e.target.value)} />
                  )}
                  {field.fieldType === 'dropdown' && (
                    <select className="input-field"
                      onChange={(e) => handleFormChange(field.label, e.target.value)}>
                      <option value="">Select...</option>
                      {field.options.map((opt, idx) => (
                        <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {field.fieldType === 'checkbox' && (
                    <input type="checkbox" className="h-4 w-4"
                      onChange={(e) => handleFormChange(field.label, e.target.checked)} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Merchandise variant selection */}
          {event.eventType === 'merchandise' && event.merchItems && event.merchItems.length > 0 && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="label">Select Variant *</label>
                <select className="input-field" value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}>
                  <option value="">Choose a variant</option>
                  {event.merchItems.map(item => (
                    <option key={item._id} value={item._id} disabled={item.stock === 0}>
                      {item.size} / {item.color} - Stock: {item.stock} {item.stock === 0 ? '(Out of stock)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantity</label>
                <input type="number" className="input-field" min={1} value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} />
              </div>
            </div>
          )}

          <button onClick={handleRegister} disabled={registering} className="btn-primary">
            {registering ? 'Processing...' : (event.eventType === 'merchandise' ? 'Purchase' : 'Register')}
          </button>
        </div>
      )}

      {/* Already registered */}
      {isRegistered && (
        <div className="card mb-6 border-green-200 bg-green-50">
          <h2 className="text-lg font-semibold text-green-800 mb-2">You are registered!</h2>
          <p className="text-sm text-green-700 mb-3">
            Status: <span className="font-medium">{registration?.status}</span>
          </p>
          {ticket && (
            <div className="bg-white rounded p-4 text-center">
              <p className="text-sm mb-2">Ticket ID: <span className="font-mono font-bold">{ticket.ticketId}</span></p>
              {ticket.qrCode && (
                <img src={ticket.qrCode} alt="QR Code" className="mx-auto" style={{ width: 180, height: 180 }} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Blocking messages */}
      {!canRegister && !isRegistered && (
        <div className="card bg-yellow-50 border-yellow-200">
          {deadlinePassed && <p className="text-yellow-800">Registration deadline has passed.</p>}
          {limitReached && <p className="text-yellow-800">Registration limit has been reached.</p>}
          {event.status !== 'published' && event.status !== 'ongoing' && (
            <p className="text-yellow-800">Registration is not open for this event.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default EventDetails;
