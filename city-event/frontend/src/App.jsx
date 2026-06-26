import PropTypes from 'prop-types';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './utils/auth';
import { ToastProvider } from './contexts/ToastContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sentry } from './utils/sentry';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GDPRConsentBanner from './components/GDPRBanner';
import 'leaflet/dist/leaflet.css';
import './styles.css';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const MyTickets = lazy(() => import('./pages/MyTickets'));
const Profile = lazy(() => import('./pages/Profile'));
const Scanner = lazy(() => import('./pages/Scanner'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const MyEvents = lazy(() => import('./pages/MyEvents'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EventDashboard = lazy(() => import('./pages/EventDashboard'));
const AttendeesList = lazy(() => import('./pages/AttendeesList'));
const CheckinDashboard = lazy(() => import('./pages/CheckinDashboard'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Privacy = lazy(() => import('./pages/Privacy'));
const About = lazy(() => import('./pages/About'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

function PageLoading() {
  return (
    <div className="page-loading">
      <div className="spinner" />
    </div>
  );
}

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoading />}>
        <Routes location={location} key={location.pathname}>
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
          <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
          <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
          <Route path="/dashboard/:id" element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />
          <Route path="/attendees/:id" element={<ProtectedRoute><AttendeesList /></ProtectedRoute>} />
          <Route path="/checkin/:id" element={<ProtectedRoute><CheckinDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={
            <motion.div
              className="page-center section-elevated"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <h1 className="section-title neon-text-cyan" style={{ fontSize: '8rem', marginBottom: '1rem' }}>404</h1>
              <h2 style={{ color: '#ffffff', marginBottom: '1rem' }}>Page Not Found</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
              <Link to="/"><button className="btn-primary">Go Home</button></Link>
            </motion.div>
          } />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <ScrollToTop />
      <AnimatedRoutes />
      <Footer />
      <GDPRConsentBanner />
    </>
  );
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={({ error }) => (
      <div className="error-fallback">
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
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
