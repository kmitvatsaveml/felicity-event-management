import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path ? 'text-indigo-300 font-semibold' : 'text-white';

  const participantLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/events', label: 'Browse Events' },
    { to: '/clubs', label: 'Clubs/Organizers' },
    { to: '/profile', label: 'Profile' }
  ];

  const organizerLinks = [
    { to: '/organizer/dashboard', label: 'Dashboard' },
    { to: '/organizer/create-event', label: 'Create Event' },
    { to: '/organizer/profile', label: 'Profile' }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/manage-clubs', label: 'Manage Clubs' }
  ];

  let links = [];
  if (user.role === 'participant') links = participantLinks;
  else if (user.role === 'organizer') links = organizerLinks;
  else if (user.role === 'admin') links = adminLinks;

  return (
    <nav className="bg-indigo-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-white text-xl font-bold">
            Felicity
          </Link>
          <div className="flex items-center gap-6">
            {links.map(link => (
              <Link key={link.to} to={link.to} className={`${isActive(link.to)} hover:text-indigo-200 transition-colors text-sm`}>
                {link.label}
              </Link>
            ))}
            <button onClick={logout} className="text-white bg-indigo-800 hover:bg-indigo-900 px-3 py-1.5 rounded text-sm transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
