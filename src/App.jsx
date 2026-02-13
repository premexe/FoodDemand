import { Routes, Route } from 'react-router-dom';
import SignInSide from './sign-in-side/SignInSide';
import Dashboard from './dashboard/Dashboard';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './auth/ProtectedRoute';

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
              <Home />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
      </Routes>
    </div>
  );
}

export default App;
