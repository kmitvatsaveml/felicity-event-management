import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function EventForum() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    loadMessages();
    loadEventInfo();
    // poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadEventInfo = async () => {
    try {
      const res = await api.get('/events/' + id);
      setEventName(res.data.event.name);
    } catch (err) {}
  };

  const loadMessages = async () => {
    try {
      const res = await api.get('/forum/' + id);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newMessage.trim()) return;
    try {
      await api.post('/forum/' + id, {
        content: newMessage.trim(),
        parentId: replyTo?._id || null,
        isAnnouncement: false
      });
      setNewMessage('');
      setReplyTo(null);
      loadMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post message');
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      await api.post('/forum/' + messageId + '/react', { emoji });
      loadMessages();
    } catch (err) {
      toast.error('Failed to react');
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    try {
      await api.delete('/forum/' + messageId);
      toast.success('Message deleted');
      loadMessages();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handlePin = async (messageId) => {
    try {
      await api.put('/forum/' + messageId + '/pin');
      loadMessages();
    } catch (err) {
      toast.error('Failed to pin message');
    }
  };

  // separate pinned, announcements, and regular messages
  const pinnedMessages = messages.filter(m => m.isPinned);
  const announcements = messages.filter(m => m.isAnnouncement && !m.isPinned);
  const regularMessages = messages.filter(m => !m.isPinned && !m.isAnnouncement && !m.parentId);
  const getReplies = (parentId) => messages.filter(m => m.parentId === parentId);

  if (loading) return <div className="text-center py-10">Loading discussion...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to={'/events/' + id} className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Event</Link>
      <h1 className="text-2xl font-bold mb-2">Discussion - {eventName}</h1>
      <p className="text-sm text-gray-500 mb-6">{messages.length} messages</p>

      {/* New Message Input */}
      <div className="card mb-6">
        {replyTo && (
          <div className="text-sm bg-gray-50 p-2 rounded mb-2 flex justify-between">
            <span>Replying to: {replyTo.content.substring(0, 50)}...</span>
            <button onClick={() => setReplyTo(null)} className="text-red-500 text-xs">Cancel</button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
            placeholder="Type your message..."
            className="input-field flex-1"
          />
          <button onClick={handlePost} className="btn-primary">Send</button>
        </div>
      </div>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-amber-600 mb-2">Pinned</h3>
          {pinnedMessages.map(msg => (
            <MessageCard key={msg._id} msg={msg} user={user}
              onReply={setReplyTo} onReact={handleReact}
              onDelete={handleDelete} onPin={handlePin}
              replies={getReplies(msg._id)} />
          ))}
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-indigo-600 mb-2">Announcements</h3>
          {announcements.map(msg => (
            <MessageCard key={msg._id} msg={msg} user={user}
              onReply={setReplyTo} onReact={handleReact}
              onDelete={handleDelete} onPin={handlePin}
              replies={getReplies(msg._id)} />
          ))}
        </div>
      )}

      {/* Regular Messages */}
      <div className="space-y-3">
        {regularMessages.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No messages yet. Start the discussion!</p>
        ) : (
          regularMessages.map(msg => (
            <MessageCard key={msg._id} msg={msg} user={user}
              onReply={setReplyTo} onReact={handleReact}
              onDelete={handleDelete} onPin={handlePin}
              replies={getReplies(msg._id)} />
          ))
        )}
      </div>
    </div>
  );
}

function MessageCard({ msg, user, onReply, onReact, onDelete, onPin, replies }) {
  const isOwn = user && msg.userId?._id === user.id;
  const isOrganizer = user && user.role === 'organizer';
  const authorName = msg.userId ? (msg.userId.firstName + ' ' + (msg.userId.lastName || '')) : 'Unknown';
  const isOrgPost = msg.userId?.role === 'organizer';

  return (
    <div className={`card ${msg.isAnnouncement ? 'border-l-4 border-indigo-500 bg-indigo-50' : ''} ${msg.isPinned ? 'border-l-4 border-amber-500' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium text-sm">{authorName}</span>
          {isOrgPost && <span className="text-xs bg-indigo-100 text-indigo-700 px-1 rounded ml-1">Organizer</span>}
          {msg.isPinned && <span className="text-xs text-amber-600 ml-1">📌</span>}
          <span className="text-xs text-gray-400 ml-2">{new Date(msg.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex gap-1">
          {isOrganizer && (
            <button onClick={() => onPin(msg._id)} className="text-xs text-gray-400 hover:text-amber-600">
              {msg.isPinned ? 'Unpin' : 'Pin'}
            </button>
          )}
          {(isOwn || isOrganizer) && (
            <button onClick={() => onDelete(msg._id)} className="text-xs text-gray-400 hover:text-red-500 ml-2">Delete</button>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm">{msg.content}</p>
      <div className="flex items-center gap-3 mt-2">
        <button onClick={() => onReact(msg._id, '👍')} className="text-xs text-gray-400 hover:text-blue-500">
          👍 {msg.reactions?.filter(r => r.emoji === '👍').length || 0}
        </button>
        <button onClick={() => onReact(msg._id, '❤️')} className="text-xs text-gray-400 hover:text-red-500">
          ❤️ {msg.reactions?.filter(r => r.emoji === '❤️').length || 0}
        </button>
        <button onClick={() => onReply(msg)} className="text-xs text-gray-400 hover:text-indigo-500">Reply</button>
      </div>

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
          {replies.map(reply => (
            <div key={reply._id} className="text-sm">
              <span className="font-medium">{reply.userId?.firstName}</span>
              {reply.userId?.role === 'organizer' && <span className="text-xs bg-indigo-100 text-indigo-700 px-1 rounded ml-1">Organizer</span>}
              <span className="text-xs text-gray-400 ml-2">{new Date(reply.createdAt).toLocaleString()}</span>
              <p className="text-gray-700">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EventForum;
