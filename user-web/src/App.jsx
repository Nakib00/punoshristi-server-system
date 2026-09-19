import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import SplashPage from './pages/SplashPage';
import OnboardingPage, { ONBOARDING_FLAG } from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpVerificationPage from './pages/OtpVerificationPage';
import DashboardPage from './pages/DashboardPage';
import ScanPage from './pages/ScanPage';
import SuccessPage from './pages/SuccessPage';
import MapPage from './pages/MapPage';
import PartnersPage from './pages/PartnersPage';
import PartnerDetailPage from './pages/PartnerDetailPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import InfoPage from './pages/InfoPage';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.phoneVerified) return <Navigate to="/verify-otp" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashPage />;
  if (user) return <Navigate to={user.phoneVerified ? '/dashboard' : '/verify-otp'} replace />;
  return children;
}

function VerifyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashPage />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <SplashPage />;
  if (user) return <Navigate to={user.phoneVerified ? '/dashboard' : '/verify-otp'} replace />;
  const onboarded = localStorage.getItem(ONBOARDING_FLAG);
  return <Navigate to={onboarded ? '/login' : '/onboarding'} replace />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/verify-otp" element={<VerifyRoute><OtpVerificationPage /></VerifyRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
        <Route path="/success" element={<ProtectedRoute><SuccessPage /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="/partners" element={<ProtectedRoute><PartnersPage /></ProtectedRoute>} />
        <Route path="/partners/:id" element={<ProtectedRoute><PartnerDetailPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/info/:topic" element={<ProtectedRoute><InfoPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
