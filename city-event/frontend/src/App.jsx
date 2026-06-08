import PropTypes from 'prop-types';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/auth';
import { ToastProvider } from './contexts/ToastContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sentry } from './utils/sentry';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import MyTickets from './pages/MyTickets';
import Profile from './pages/Profile';
import Scanner from './pages/Scanner';
import CreateEvent from './pages/CreateEvent';
import MyEvents from './pages/MyEvents';
import AdminDashboard from './pages/AdminDashboard';
import EventDashboard from './pages/EventDashboard';
import AttendeesList from './pages/AttendeesList';
import CheckinDashboard from './pages/CheckinDashboard';
import Wishlist from './pages/Wishlist';
import Privacy from './pages/Privacy';
import About from './pages/About';
import TermsOfService from './pages/TermsOfService';
import GDPRConsentBanner from './components/GDPRBanner';
import 'leaflet/dist/leaflet.css';
import './styles.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<TermsOfService />} />
        
        {/* Protected Routes */}
        <Route 
          path="/my-tickets" 
          element={
            <ProtectedRoute>
              <MyTickets />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/scanner" 
          element={
            <ProtectedRoute>
              <Scanner />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-event" 
          element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-events" 
          element={
            <ProtectedRoute>
              <MyEvents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/:id" 
          element={
            <ProtectedRoute>
              <EventDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/attendees/:id" 
          element={
            <ProtectedRoute>
              <AttendeesList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/checkin/:id" 
          element={
            <ProtectedRoute>
              <CheckinDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* 404 */}
        <Route path="*" element={
          <div style={{ 
            textAlign: 'center',
            padding: 'var(--spacing-xxl)',
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <h1 style={{ fontSize: '6rem', marginBottom: 'var(--spacing-md)' }}>404</h1>
            <h2>Page Not Found</h2>
            <p style={{ color: 'var(--light-gray)', marginTop: 'var(--spacing-md)' }}>
              The page you're looking for doesn't exist.
            </p>
            <a href="/">
              <button className="btn-primary" style={{ marginTop: 'var(--spacing-lg)' }}>
                Go Home
              </button>
            </a>
          </div>
        } />
      </Routes>
      <Footer />
      <GDPRConsentBanner />
    </>
  );
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={({ error }) => (
      <div style={{ textAlign: 'center', padding: '4rem', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Something went wrong</h2>
        <p style={{ color: 'var(--light-gray)', marginBottom: '2rem' }}>{error.message}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    )}>
      <ErrorBoundary>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <WishlistProvider>
                <AppRoutes />
              </WishlistProvider>
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  );
}
