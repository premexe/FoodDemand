import { Navigate, Routes, Route } from 'react-router-dom';
import SignInSide from './sign-in-side/SignInSide';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './auth/ProtectedRoute';
import UploadDataPage from './pages/UploadDataPage';
import HomeDashboardPage from './pages/HomeDashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <div className="min-h-screen font-['Inter']">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<SignInSide />} />
        <Route
          path="/home"
          element={(
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/upload"
          element={(
            <ProtectedRoute>
              <UploadDataPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <HomeDashboardPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/analytics"
          element={(
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
