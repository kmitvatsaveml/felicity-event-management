import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getUploadUrl } from '../../utils/api';
import toast from 'react-hot-toast';

function PaymentApprovals() {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [ordersRes, eventRes] = await Promise.all([
        api.get('/organizers/events/' + id + '/payments'),
        api.get('/organizers/events/' + id)
      ]);
      setOrders(ordersRes.data);
      setEvent(eventRes.data.event);
    } catch (err) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (regId) => {
    try {
      await api.put('/organizers/payments/' + regId + '/approve', { note: 'Payment verified' });
      toast.success('Payment approved, ticket generated');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (regId) => {
    const note = prompt('Reason for rejection:');
    if (!note) return;
    try {
      await api.put('/organizers/payments/' + regId + '/reject', { note });
      toast.success('Payment rejected');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  const filtered = orders.filter(o => {
    if (filter === 'all') return true;
    return o.paymentStatus === filter;
  });

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <Link to={'/organizer/events/' + id} className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Event</Link>
      <h1 className="text-2xl font-bold mb-4">Payment Approvals - {event?.name}</h1>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm capitalize ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {f} ({orders.filter(o => f === 'all' ? true : o.paymentStatus === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-gray-400 py-8">No orders found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const user = order.userId;
            return (
              <div key={order._id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-sm mt-1">
                      Item: {order.merchSelection?.size} / {order.merchSelection?.color}
                      {order.merchSelection?.quantity > 1 && ' x' + order.merchSelection.quantity}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ordered: {new Date(order.createdAt).toLocaleString()}
                    </p>
                    {order.paymentNote && (
                      <p className="text-xs text-gray-500 mt-1">Note: {order.paymentNote}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.paymentStatus === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>{order.paymentStatus}</span>
                    {order.ticketId && (
                      <p className="text-xs text-indigo-600 mt-1">Ticket: {order.ticketId}</p>
                    )}
                  </div>
                </div>

                {order.paymentProof && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-sm font-medium mb-1">Payment Proof:</p>
                    <img src={getUploadUrl(order.paymentProof)} alt="Payment proof"
                      className="max-w-xs rounded border cursor-pointer"
                      onClick={() => window.open(getUploadUrl(order.paymentProof), '_blank')} />
                  </div>
                )}

                {order.paymentStatus === 'pending' && (
                  <div className="mt-3 border-t pt-3 flex gap-2">
                    <button onClick={() => handleApprove(order._id)}
                      className="btn-primary text-sm">Approve</button>
                    <button onClick={() => handleReject(order._id)}
                      className="btn-danger text-sm">Reject</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PaymentApprovals;
