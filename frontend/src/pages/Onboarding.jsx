import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const INTEREST_OPTIONS = [
  'Technology', 'Music', 'Dance', 'Art', 'Gaming',
  'Literature', 'Photography', 'Coding', 'Robotics',
  'Dramatics', 'Sports', 'Design', 'Quiz', 'Finance'
];

function Onboarding() {
  const [interests, setInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [followedOrgs, setFollowedOrgs] = useState([]);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const res = await api.get('/users/organizers');
      setOrganizers(res.data);
    } catch (err) {
      console.error('Failed to load organizers');
    }
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const toggleFollow = (orgId) => {
    if (followedOrgs.includes(orgId)) {
      setFollowedOrgs(followedOrgs.filter(id => id !== orgId));
    } else {
      setFollowedOrgs([...followedOrgs, orgId]);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/users/onboarding', { interests, followedOrganizers: followedOrgs });
      updateUser({ onboardingDone: true, interests, followedOrganizers: followedOrgs });
      toast.success('Preferences saved!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save preferences');
    }
  };

  const handleSkip = async () => {
    try {
      await api.put('/users/onboarding', { interests: [], followedOrganizers: [] });
      updateUser({ onboardingDone: true });
      navigate('/dashboard');
    } catch (err) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Welcome to Felicity!</h1>
      <p className="text-gray-600 mb-6">Set up your preferences to get personalized event recommendations.</p>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-3">Select your interests</h2>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map(interest => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                interests.includes(interest)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {organizers.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-3">Follow Clubs / Organizers</h2>
          <div className="space-y-2">
            {organizers.map(org => (
              <div key={org._id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-sm text-gray-500">{org.category}</p>
                </div>
                <button
                  onClick={() => toggleFollow(org._id)}
                  className={`px-3 py-1 rounded text-sm ${
                    followedOrgs.includes(org._id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {followedOrgs.includes(org._id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary">Save Preferences</button>
        <button onClick={handleSkip} className="btn-secondary">Skip for now</button>
      </div>
    </div>
  );
}

export default Onboarding;
