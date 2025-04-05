import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import BookingManagement from './components/BookingManagement';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const adminToken = Cookies.get('admin_jwt_token');
  
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const adminToken = Cookies.get('admin_jwt_token');
      setIsAuthenticated(!!adminToken);
    };

    checkAuth();
    // Check authentication status when app loads
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/admin/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/admin/dashboard" replace /> : 
                <AdminLogin />
            } 
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* New Route for Booking Management */}
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute>
                <BookingManagement />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to login */}
          <Route 
            path="/" 
            element={<Navigate to="/admin/login" replace />} 
          />

          {/* 404 Route */}
          <Route 
            path="*" 
            element={
              <div className="not-found">
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <button onClick={() => window.history.back()}>Go Back</button>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
