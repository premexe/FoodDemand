import { Routes, Route } from 'react-router-dom';
import SignInSide from './sign-in-side/SignInSide';
import Dashboard from './dashboard/Dashboard';
import Home from './pages/Home';
import ProtectedRoute from './auth/ProtectedRoute';

function App() {
  return (
    <div className="bg-white min-h-screen text-black font-['Inter']">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<SignInSide />} />
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
