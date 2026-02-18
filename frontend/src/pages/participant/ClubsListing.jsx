import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function ClubsListing() {
  const { user } = useAuth();
  const [organizers, setOrganizers] = useState([]);
  const [followedIds, setFollowedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizers();
    fetchFollowed();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const res = await api.get('/users/organizers');
      setOrganizers(res.data);
    } catch (err) {
      console.error('Failed to load organizers');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowed = async () => {
    try {
      const res = await api.get('/auth/me');
      setFollowedIds(res.data.followedOrganizers || []);
    } catch (err) {
      // ignore
    }
  };

  const handleFollow = async (orgId) => {
    try {
      await api.post('/users/follow/' + orgId);
      setFollowedIds([...followedIds, orgId]);
      toast.success('Followed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to follow');
    }
  };

  const handleUnfollow = async (orgId) => {
    try {
      await api.delete('/users/follow/' + orgId);
      setFollowedIds(followedIds.filter(id => id !== orgId));
      toast.success('Unfollowed');
    } catch (err) {
      toast.error('Failed to unfollow');
    }
  };

  if (loading) return <div className="text-center py-10">Loading clubs...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clubs & Organizers</h1>

      {organizers.length === 0 ? (
        <p className="text-gray-400 text-center py-10">No clubs or organizers available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizers.map(org => {
            const isFollowed = followedIds.includes(org._id);
            return (
              <div key={org._id} className="card">
                <Link to={'/clubs/' + org._id} className="block mb-3">
                  <h3 className="font-semibold text-indigo-700 text-lg hover:underline">{org.name}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{org.category}</span>
                </Link>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{org.description || 'No description available.'}</p>
                <button
                  onClick={() => isFollowed ? handleUnfollow(org._id) : handleFollow(org._id)}
                  className={`text-sm px-4 py-1.5 rounded transition-colors ${
                    isFollowed
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isFollowed ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ClubsListing;
