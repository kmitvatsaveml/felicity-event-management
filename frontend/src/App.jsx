import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';

import ParticipantDashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import ParticipantProfile from './pages/participant/Profile';
import ClubsListing from './pages/participant/ClubsListing';
import OrganizerView from './pages/participant/OrganizerView';
import TicketDetail from './pages/participant/TicketDetail';
import EventForum from './pages/participant/EventForum';
import EventFeedback from './pages/participant/EventFeedback';

import OrganizerDashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import OrgEventDetail from './pages/organizer/EventDetail';
import OrganizerProfile from './pages/organizer/Profile';
import PaymentApprovals from './pages/organizer/PaymentApprovals';
import QRScanner from './pages/organizer/QRScanner';

import AdminDashboard from './pages/admin/Dashboard';
import ManageClubs from './pages/admin/ManageClubs';
import PasswordResetRequests from './pages/admin/PasswordResetRequests';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading...</div>;
  }

  // redirect logic for root path
  const getHomePath = () => {
    if (!user) return '/login';
    if (user.role === 'participant') {
      return user.onboardingDone ? '/dashboard' : '/onboarding';
    }
    if (user.role === 'organizer') return '/organizer/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to={getHomePath()} replace />} />
          <Route path="/login" element={user ? <Navigate to={getHomePath()} replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to={getHomePath()} replace /> : <Signup />} />

          <Route path="/onboarding" element={
            <ProtectedRoute roles={['participant']}>
              <Onboarding />
            </ProtectedRoute>
          } />

          {/* Participant Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['participant']}><ParticipantDashboard /></ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute roles={['participant']}><BrowseEvents /></ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute roles={['participant']}><EventDetails /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute roles={['participant']}><ParticipantProfile /></ProtectedRoute>
          } />
          <Route path="/clubs" element={
            <ProtectedRoute roles={['participant']}><ClubsListing /></ProtectedRoute>
          } />
          <Route path="/clubs/:id" element={
            <ProtectedRoute roles={['participant']}><OrganizerView /></ProtectedRoute>
          } />
          <Route path="/ticket/:ticketId" element={
            <ProtectedRoute roles={['participant']}><TicketDetail /></ProtectedRoute>
          } />
          <Route path="/events/:id/forum" element={
            <ProtectedRoute roles={['participant', 'organizer']}><EventForum /></ProtectedRoute>
          } />
          <Route path="/events/:id/feedback" element={
            <ProtectedRoute roles={['participant']}><EventFeedback /></ProtectedRoute>
          } />

          {/* Organizer Routes */}
          <Route path="/organizer/dashboard" element={
            <ProtectedRoute roles={['organizer']}><OrganizerDashboard /></ProtectedRoute>
          } />
          <Route path="/organizer/create-event" element={
            <ProtectedRoute roles={['organizer']}><CreateEvent /></ProtectedRoute>
          } />
          <Route path="/organizer/events/:id/edit" element={
            <ProtectedRoute roles={['organizer']}><EditEvent /></ProtectedRoute>
          } />
          <Route path="/organizer/events/:id" element={
            <ProtectedRoute roles={['organizer']}><OrgEventDetail /></ProtectedRoute>
          } />
          <Route path="/organizer/profile" element={
            <ProtectedRoute roles={['organizer']}><OrganizerProfile /></ProtectedRoute>
          } />
          <Route path="/organizer/events/:id/payments" element={
            <ProtectedRoute roles={['organizer']}><PaymentApprovals /></ProtectedRoute>
          } />
          <Route path="/organizer/events/:id/scanner" element={
            <ProtectedRoute roles={['organizer']}><QRScanner /></ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/manage-clubs" element={
            <ProtectedRoute roles={['admin']}><ManageClubs /></ProtectedRoute>
          } />
          <Route path="/admin/password-resets" element={
            <ProtectedRoute roles={['admin']}><PasswordResetRequests /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to={getHomePath()} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
